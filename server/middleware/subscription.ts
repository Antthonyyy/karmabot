import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { AuthRequest } from '../auth';

type SubscriptionPlan = 'light' | 'plus' | 'pro' | 'trial';

const planHierarchy: Record<SubscriptionPlan, number> = {
  pro: 3,
  plus: 2,
  light: 1,
  trial: 0
};

export function requireSubscription(minPlan: SubscriptionPlan = 'light') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const subscriptions = await storage.getUserSubscriptions(req.user.id);
      
      // ИСПРАВЛЕНИЕ: Проверяем не только status, но и expiration date
      const activeSub = subscriptions.find(sub => {
        const isActive = sub.status === 'active';
        const notExpired = !sub.expiresAt || new Date(sub.expiresAt) > new Date();
        return isActive && notExpired;
      });
      
      if (!activeSub) {
        return res.status(402).json({ 
          error: 'No active subscription',
          code: 'SUBSCRIPTION_REQUIRED',
          requiredPlan: minPlan
        });
      }

      // Check plan hierarchy
      const userPlanLevel = planHierarchy[activeSub.plan as SubscriptionPlan];
      const requiredLevel = planHierarchy[minPlan];
      
      if (userPlanLevel === undefined) {
        console.error(`Unknown subscription plan: ${activeSub.plan}`);
        return res.status(402).json({ error: 'Invalid subscription plan' });
      }
      
      if (userPlanLevel >= requiredLevel) {
        return next();
      }

      return res.status(402).json({ 
        error: 'Upgrade plan required',
        code: 'PLAN_UPGRADE_REQUIRED',
        currentPlan: activeSub.plan,
        requiredPlan: minPlan
      });
    } catch (error) {
      console.error('Subscription middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}