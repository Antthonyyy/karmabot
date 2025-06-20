import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { telegramService } from "./services/telegramService.js";
import { storage } from "./storage.js";

const JWT_SECRET = process.env.JWT_SECRET || "karma-diary-secret-key";

export interface AuthRequest extends Request {
  user?: any;
}

// Generate JWT token
export function generateToken(user: any): string {
  return jwt.sign(
    { 
      id: user.id, 
      telegramId: user.telegramId,
      firstName: user.firstName 
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Verify JWT token middleware
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    try {
      // Get fresh user data
      const user = await storage.getUser(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
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

// Telegram authentication handler
export async function handleTelegramAuth(telegramData: any): Promise<{ user: any; token: string; isNewUser: boolean }> {
  // For demo purposes, skip verification if it's a mock hash
  const isMockAuth = telegramData.hash && telegramData.hash.startsWith('mock_hash_');
  
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
