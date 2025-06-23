import { storage } from '../storage';
import { InsertSubscription, Subscription } from '@shared/schema';

export class SubscriptionService {
  // Check if user has active subscription
  async hasActiveSubscription(userId: number): Promise<boolean> {
    try {
      const subscriptions = await storage.getUserSubscriptions(userId);
      return subscriptions.some(sub => 
        sub.status === 'active' && 
        new Date(sub.endDate) > new Date()
      );
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  // Get user's current subscription plan
  async getCurrentPlan(userId: number): Promise<string> {
    try {
      const subscriptions = await storage.getUserSubscriptions(userId);
      const activeSub = subscriptions.find(sub => 
        sub.status === 'active' && 
        new Date(sub.endDate) > new Date()
      );
      return activeSub?.plan || 'none';
    } catch (error) {
      console.error('Error getting current plan:', error);
      return 'none';
    }
  }

  // Check subscription limits for AI requests
  async checkAIRequestLimit(userId: number): Promise<{ allowed: boolean; remaining: number }> {
    const plan = await this.getCurrentPlan(userId);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyRequests = await storage.getMonthlyAIRequests(userId, currentMonth);
    
    const limits = {
      none: 5,
      light: 50,
      plus: 200,
      pro: 1000
    };

    const limit = limits[plan as keyof typeof limits] || limits.none;
    const remaining = Math.max(0, limit - monthlyRequests);
    
    return {
      allowed: remaining > 0,
      remaining
    };
  }

  // Create new subscription
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    return await storage.createSubscription(subscription);
  }

  // Update subscription status
  async updateSubscriptionStatus(subscriptionId: number, status: string): Promise<void> {
    await storage.updateSubscriptionStatus(subscriptionId, status);
  }
}

export const subscriptionService = new SubscriptionService();