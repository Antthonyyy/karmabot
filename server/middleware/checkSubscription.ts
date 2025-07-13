// server/middleware/checkSubscription.ts

import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { AuthRequest } from '../auth';

type SubscriptionPlan = 'light' | 'plus' | 'pro';

const planHierarchy: Record<SubscriptionPlan, number> = {
  pro: 2,
  plus: 1,
  light: 0
};

export function checkSubscription(minPlan: SubscriptionPlan = 'light') {
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

export function checkFeatureLimit(feature: string, limit: number) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // TODO: Implement getUserFeatureUsage in storage
      // For now, we'll skip the usage check
      console.log(`Feature limit check for ${feature} (limit: ${limit}) - not implemented yet`);
      
      next();
    } catch (error) {
      console.error('Feature limit check error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}
