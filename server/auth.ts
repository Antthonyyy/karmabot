import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { telegramService } from "./services/telegramService.js";
import { googleService } from "./services/googleService.js";
import { storage } from "./storage.js";

// Валидация JWT_SECRET - критически важно для безопасности
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

// Только в development режиме показываем статус конфигурации
if (process.env.NODE_ENV === 'development') {
  console.log('🔑 JWT_SECRET configured: Yes');
  console.log('🔑 JWT_SECRET length:', JWT_SECRET.length);
}

export interface AuthRequest extends Request {
  user?: any;
}

// Generate JWT token
export function generateToken(user: any): string {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎫 Generating token for user:', user.id);
  }
  
  const token = jwt.sign(
    { 
      id: user.id, 
      telegramId: user.telegramId,
      firstName: user.firstName 
    },
    JWT_SECRET,
    { expiresIn: '24h' } // Сокращено с 30d до 24h для безопасности
  );
  
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Token generated successfully');
  }
  return token;
}

// Verify JWT token middleware
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing');
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header or invalid format');
      return res.status(401).json({ message: 'No valid authorization header' });
    }
    
    const token = authHeader.substring(7);
    if (process.env.NODE_ENV === 'development') {
      console.log('🎫 Token extracted, length:', token.length);
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Token verified, user ID:', decoded.id);
      }

      // Get fresh user data
      const user = await storage.getUser(decoded.id);
      if (!user) {
        console.error('❌ User not found in database for ID:', decoded.id);
        return res.status(404).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error: any) {
      console.error("❌ JWT verification error:", error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(403).json({ 
          message: "Token expired", 
          details: "Please login again" 
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(403).json({ 
          message: "Invalid token" 
        });
      }
      
      return res.status(403).json({ 
        message: "Invalid or expired token"
      });
    }
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
      } catch (error: any) {
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

