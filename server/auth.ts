import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { telegramService } from "./services/telegramService.js";
import { googleService } from "./services/googleService.js";
import { storage } from "./storage.js";

const JWT_SECRET = process.env.JWT_SECRET || "karma-diary-secret-key";

console.log('🔑 JWT_SECRET configured:', JWT_SECRET ? 'Yes' : 'No');
console.log('🔑 JWT_SECRET length:', JWT_SECRET?.length);
console.log('🔑 JWT_SECRET preview:', JWT_SECRET.substring(0, 20) + '...');

export interface AuthRequest extends Request {
  user?: any;
}

// Generate JWT token
export function generateToken(user: any): string {
  console.log('🎫 Generating token for user:', user.id);
  console.log('🔑 Using JWT_SECRET for generation:', JWT_SECRET.substring(0, 20) + '...');
  
  const token = jwt.sign(
    { 
      id: user.id, 
      telegramId: user.telegramId,
      firstName: user.firstName 
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
  
  console.log('✅ Token generated successfully, length:', token.length);
  return token;
}

// Verify JWT token middleware
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header or invalid format');
      return res.status(401).json({ message: 'No valid authorization header' });
    }
    
    const token = authHeader.substring(7);
    console.log('🎫 Token extracted, length:', token.length);
    console.log('🎫 Token preview:', token.substring(0, 20) + '...');
    console.log('🔑 Using JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...');
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      console.log('✅ Token verified, user ID:', decoded.id);

      // Get fresh user data  
      storage.getUser(decoded.id).then(user => {
        if (!user) {
          console.error('❌ User not found in database for ID:', decoded.id);
          return res.status(404).json({ message: 'User not found' });
        }

        req.user = user;
        next();
      }).catch(error => {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error', details: error?.message });
      });
    } catch (error) {
      console.error("❌ JWT verification error:", error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(403).json({ 
          message: "Token expired", 
          details: "Please login again" 
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(403).json({ 
          message: "Invalid token", 
          details: error.message 
        });
      }
      
      return res.status(403).json({ 
        message: "Invalid or expired token", 
        details: error.message 
      });
    }
  } catch (error) {
    console.error("❌ Authentication error:", error?.message);
    return res.status(500).json({ message: 'Authentication failed', details: error?.message });
  }
}

// Optional authentication - doesn't fail if no token
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (!err && decoded) {
      try {
        const user = await storage.getUser(decoded.id);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        console.error('Error fetching user in optionalAuth:', error);
      }
    }
    next();
  });
}

// Google authentication handler
export async function handleGoogleAuth(googleIdToken: string): Promise<{ user: any; token: string; isNewUser: boolean; needsSubscription: boolean }> {
  console.log('=== GOOGLE AUTH REQUEST ===', { 
    idToken: googleIdToken ? googleIdToken.substring(0, 50) + '...' : 'null',
    timestamp: new Date().toISOString()
  });
  
  const googleUser = await googleService.verifyIdToken(googleIdToken);
  
  if (!googleUser) {
    throw new Error('Invalid Google token');
  }

  console.log('🔍 Google user data:', {
    email: googleUser.email,
    emailLength: googleUser.email ? googleUser.email.length : 0,
    emailHasAt: googleUser.email ? googleUser.email.includes('@') : false,
    given_name: googleUser.given_name,
    family_name: googleUser.family_name
  });

  let user = await storage.getUserByEmail(googleUser.email);
  let isNewUser = false;

  if (!user) {
    // Create new user from Google data
    const userData = {
      email: googleUser.email,
      firstName: googleUser.given_name,
      lastName: googleUser.family_name || null,
      username: googleUser.email.split('@')[0], // Use email prefix as username
      profilePicture: googleUser.picture,
      language: googleUser.locale.startsWith('uk') ? 'uk' : 'en',
      isActive: true,
      subscription: 'none', // Добавляем значение по умолчанию
    };

    user = await storage.createUser(userData);
    
    // Initialize user stats
    await storage.initializeUserStats(user.id);
    
    isNewUser = true;
  } else {
    // Update user info from Google
    user = await storage.updateUser(user.id, {
      firstName: googleUser.given_name,
      lastName: googleUser.family_name || null,
      profilePicture: googleUser.picture,
    });
  }

  // Generate JWT token
  const token = generateToken(user);
  
  // Check if user needs subscription - only for new users or users with 'none' subscription
  let needsSubscription = false;
  if (isNewUser || !user.subscription || user.subscription === 'none') {
    // Check if user has any active subscriptions from database
    const userSubscriptions = await storage.getUserSubscriptions(user.id);
    const hasActiveSubscription = userSubscriptions.some(sub => 
      sub.status === 'active' && sub.expiresAt && new Date(sub.expiresAt) > new Date()
    );
    
    // Only redirect to subscriptions if no active subscription found
    needsSubscription = !hasActiveSubscription;
  }

  return { user, token, isNewUser, needsSubscription };
}

// Telegram authentication handler
export async function handleTelegramAuth(telegramData: any): Promise<{ user: any; token: string; isNewUser: boolean }> {
  // For demo purposes, skip verification if it's a mock hash
  const isMockAuth = telegramData.hash && (telegramData.hash.startsWith('mock_hash_') || telegramData.hash.startsWith('demo_hash_'));
  
  if (!isMockAuth && !telegramService.verifyTelegramAuth(telegramData)) {
    throw new Error('Invalid Telegram authentication data');
  }

  const telegramId = telegramData.id.toString();
  
  // Check if user exists
  let user = await storage.getUserByTelegramId(telegramId);
  let isNewUser = false;

  if (!user) {
    // Create new user
    const userData = {
      telegramId,
      telegramChatId: telegramId, // Initial chat ID, may be updated later
      firstName: telegramData.first_name,
      lastName: telegramData.last_name || null,
      username: telegramData.username || null,
      currentPrinciple: 1,
      timezoneOffset: 0,
      notificationType: 'daily' as const,
      customTimes: null,
      language: 'uk',
      isActive: true,
    };

    user = await storage.createUser(userData);
    
    // Initialize user stats
    await storage.initializeUserStats(user.id);
    
    // Create trial subscription (3 days free)
    // const trialExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    // await storage.createSubscription({
    //   userId: user.id,
    //   plan: 'trial',
    //   expiresAt: trialExpiresAt,
    //   status: 'active'
    // });
    
    isNewUser = true;
  } else {
    // Update user info from Telegram
    user = await storage.updateUser(user.id, {
      firstName: telegramData.first_name,
      lastName: telegramData.last_name || null,
      username: telegramData.username || null,
    });
  }

  // Generate JWT token
  const token = generateToken(user);

  return { user, token, isNewUser };
}