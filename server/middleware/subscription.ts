import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { AuthRequest } from '../auth';

type SubscriptionPlan = 'trial' | 'light' | 'plus' | 'pro';

interface SubscriptionMiddlewareOptions {
  minPlan: SubscriptionPlan;
}

const planHierarchy: Record<SubscriptionPlan, number> = {
  trial: 4, // Trial has access to all features for 3 days
  pro: 3,
  plus: 2,
  light: 1,
};

export function requireSubscription(options: SubscriptionMiddlewareOptions) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get user's active subscription
      const subscriptions = await storage.getUserSubscriptions(user.id);
      const activeSubscription = subscriptions.find(sub => sub.status === 'active');

      if (!activeSubscription) {
        return res.status(403).json({ 
          message: 'Subscription required',
          required: options.minPlan
        });
      }

      const userPlan = activeSubscription.plan as SubscriptionPlan;
      const now = new Date();

      // Special handling for trial
      if (userPlan === 'trial') {
        if (activeSubscription.expiresAt && activeSubscription.expiresAt > now) {
          // Trial is still active - allow access to all features
          return next();
        } else {
          // Trial expired
          return res.status(403).json({ 
            message: 'Trial expired. Please upgrade to continue.',
            required: options.minPlan,
            trialExpired: true
          });
        }
      }

      // Regular plan check
      const userPlanLevel = planHierarchy[userPlan];
      const requiredPlanLevel = planHierarchy[options.minPlan];

      if (!userPlanLevel || userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({ 
          message: 'Higher subscription plan required',
          current: userPlan,
          required: options.minPlan
        });
      }

      // Check if subscription is not expired (for paid plans)
      if (activeSubscription.expiresAt && activeSubscription.expiresAt < now) {
        return res.status(403).json({ 
          message: 'Subscription expired. Please renew to continue.',
          required: options.minPlan,
          expired: true
        });
      }

      next();
    } catch (error) {
      console.error('Subscription middleware error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

export function requirePlan(plan: SubscriptionPlan) {
  return requireSubscription({ minPlan: plan });
}