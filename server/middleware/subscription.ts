import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { AuthRequest } from '../auth';

type SubscriptionPlan = 'trial' | 'light' | 'plus' | 'pro';

const planHierarchy: Record<SubscriptionPlan, number> = {
  trial: 3,
  pro: 2,
  plus: 1,
  light: 0
};

export function requireSubscription(minPlan: SubscriptionPlan = 'light') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const subscriptions = await storage.getUserSubscriptions(req.user.id);
      const activeSub = subscriptions.find(sub => sub.status === 'active');
      
      if (!activeSub) {
        return res.status(402).json({ error: 'No active subscription' });
      }

      // Trial users get full access if not expired
      if (activeSub.plan === 'trial') {
        if (activeSub.expiresAt && new Date(activeSub.expiresAt) > new Date()) {
          return next();
        }
        // Trial expired, continue to plan check
      }

      // Check plan hierarchy
      const userPlanLevel = planHierarchy[activeSub.plan as SubscriptionPlan];
      const requiredLevel = planHierarchy[minPlan];
      
      if (userPlanLevel >= requiredLevel) {
        return next();
      }

      return res.status(402).json({ error: 'Upgrade plan required' });
    } catch (error) {
      console.error('Subscription middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}