import { subscriptionService } from '../services/subscriptionService';
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: any;
  subscription?: any;
}

export function requireSubscription(minPlan: 'light' | 'plus' | 'pro') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('Checking subscription for user:', req.user?.id);
      console.log('Required plan:', minPlan);
      
      // TEMPORARY: Allow all users for AI testing
      console.log('TEMPORARY: Allowing all users for AI testing');
      return next();
      
      /* Commented out for testing
      const subscription = await subscriptionService.getUserSubscription(req.user.id);
      
      const planLevels = { none: 0, light: 1, plus: 2, pro: 3 };
      const userLevel = planLevels[subscription.plan] || 0;
      const requiredLevel = planLevels[minPlan];
      
      if (userLevel < requiredLevel) {
        return res.status(403).json({
          error: 'Insufficient subscription level',
          required: minPlan,
          current: subscription.plan
        });
      }
      
      req.subscription = subscription;
      next();
      */
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({ error: 'Failed to check subscription' });
    }
  };
}