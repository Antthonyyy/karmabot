import { db } from '../db';
import { users, subscriptions } from '@shared/schema';
import { eq, and, gte } from 'drizzle-orm';
import { createHash } from 'crypto';

export class SubscriptionService {
  private plans = {
    light: {
      name: 'Карма Лайт',
      monthly: { price: 5, currency: 'EUR' },
      yearly: { price: 50, currency: 'EUR' },
      features: {
        aiRequests: 0,
        analytics: 'extended',
        achievements: true,
        export: true
      }
    },
    plus: {
      name: 'Карма Плюс',
      monthly: { price: 10, currency: 'EUR' },
      yearly: { price: 100, currency: 'EUR' },
      features: {
        aiRequests: 5,
        aiChat: false,
        analytics: 'full',
        achievements: true,
        export: true
      }
    },
    pro: {
      name: 'Карма Про',
      monthly: { price: 20, currency: 'EUR' },
      yearly: { price: 200, currency: 'EUR' },
      features: {
        aiRequests: 999,
        aiChat: true,
        analytics: 'premium',
        achievements: true,
        export: true,
        priority: true
      }
    }
  };

  async getUserSubscription(userId: number) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) throw new Error('User not found');
    
    // Проверяем, не истекла ли подписка
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date()) {
      await this.cancelSubscription(userId);
      return { plan: 'none', expired: true };
    }
    
    return {
      plan: user.subscription || 'none',
      startDate: user.subscriptionStartDate,
      endDate: user.subscriptionEndDate,
      features: this.getFeatures(user.subscription || 'none')
    };
  }

  getFeatures(plan: string) {
    if (plan === 'none') {
      return {
        aiRequests: 0,
        aiChat: false,
        analytics: 'basic',
        achievements: false,
        export: false
      };
    }
    
    return this.plans[plan]?.features || {};
  }

  async createPayment(userId: number, planId: string, billingPeriod: 'monthly' | 'yearly') {
    const plan = this.plans[planId];
    if (!plan) throw new Error('Invalid plan');
    
    const price = plan[billingPeriod].price;
    const orderId = `sub_${userId}_${Date.now()}`;
    
    const paymentData = {
      merchantAccount: process.env.WAYFORPAY_MERCHANT,
      merchantDomainName: process.env.FRONTEND_URL,
      orderReference: orderId,
      orderDate: Math.floor(Date.now() / 1000),
      amount: price,
      currency: 'EUR',
      productName: [`${plan.name} (${billingPeriod === 'yearly' ? 'Річна' : 'Місячна'})`],
      productPrice: [price],
      productCount: [1],
      serviceUrl: `${process.env.FRONTEND_URL}/api/webhooks/wayforpay`
    };
    
    // Создаем подпись
    const signString = [
      paymentData.merchantAccount,
      paymentData.merchantDomainName,
      paymentData.orderReference,
      paymentData.orderDate,
      paymentData.amount,
      paymentData.currency,
      ...paymentData.productName,
      ...paymentData.productPrice,
      ...paymentData.productCount
    ].join(';');
    
    const merchantSignature = createHash('md5')
      .update(signString + ';' + process.env.WAYFORPAY_SECRET)
      .digest('hex');
    
    // Сохраняем pending подписку
    await db.insert(subscriptions).values({
      userId,
      plan: planId,
      billingPeriod,
      startDate: new Date(),
      endDate: new Date(Date.now() + (billingPeriod === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      status: 'pending',
      paymentOrderId: orderId,
      amount: price,
      currency: 'EUR'
    });
    
    return {
      paymentData: { ...paymentData, merchantSignature },
      paymentUrl: 'https://secure.wayforpay.com/pay'
    };
  }

  async activateSubscription(orderId: string) {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.paymentOrderId, orderId)
    });
    
    if (!sub) throw new Error('Subscription not found');
    
    // Активируем подписку
    await db.update(subscriptions)
      .set({ status: 'active' })
      .where(eq(subscriptions.id, sub.id));
    
    // Обновляем пользователя
    await db.update(users)
      .set({
        subscription: sub.plan,
        subscriptionStartDate: sub.startDate,
        subscriptionEndDate: sub.endDate
      })
      .where(eq(users.id, sub.userId));
    
    return sub;
  }

  async cancelSubscription(userId: number) {
    await db.update(users)
      .set({
        subscription: 'none',
        subscriptionStartDate: null,
        subscriptionEndDate: null
      })
      .where(eq(users.id, userId));
    
    await db.update(subscriptions)
      .set({ status: 'cancelled' })
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ));
  }

  getAllPlans() {
    return [
      {
        id: 'light',
        name: 'Карма Лайт',
        monthly: 5,
        yearly: 50,
        currency: 'EUR',
        features: [
          'Telegram нагадування',
          'Швидкі записи',
          'Розширена статистика',
          'Експорт даних'
        ]
      },
      {
        id: 'plus',
        name: 'Карма Плюс',
        monthly: 10,
        yearly: 100,
        currency: 'EUR',
        features: [
          'Все з Лайт',
          'AI-поради (5/місяць)',
          'Досягнення та геймификація',
          'Аналітика настрою'
        ]
      },
      {
        id: 'pro',
        name: 'Карма Про',
        monthly: 20,
        yearly: 200,
        currency: 'EUR',
        features: [
          'Все з Плюс',
          'Необмежений AI-чат',
          'Персональні інсайти',
          'Пріоритетна підтримка'
        ]
      }
    ];
  }
}

export const subscriptionService = new SubscriptionService();