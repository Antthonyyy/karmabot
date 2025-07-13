import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../auth';

export function requireOnboarding() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user.hasCompletedOnboarding) {
      return res.status(403).json({ 
        error: 'Onboarding required',
        redirectTo: '/onboarding' 
      });
    }
    next();
  };
} 