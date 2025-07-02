import webpush from 'web-push';
import { storage } from '../storage.js';

// Configure VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_EMAIL || 'mailto:admin@karmajournal.app'
};

let vapidConfigured = false;

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  try {
    webpush.setVapidDetails(
      vapidKeys.subject,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
    vapidConfigured = true;
    console.log('✅ Web Push VAPID keys configured');
  } catch (error) {
    console.error('❌ VAPID key configuration error:', error.message);
    console.log('⚠️ Web Push notifications disabled due to invalid VAPID keys');
  }
} else {
  console.log('⚠️ Web Push VAPID keys not configured - push notifications disabled');
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class PushService {
  static async sendToUser(userId: number, payload: PushNotificationPayload) {
    if (!vapidConfigured) {
      console.log('Push notification skipped - VAPID keys not configured');
      return;
    }

    try {
      const subscriptions = await storage.getUserPushSubscriptions(userId);
      
      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return;
      }

      const pushPromises = subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };

          const notificationPayload = JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/logo-192.png',
            badge: payload.badge || '/logo-192.png',
            data: {
              url: '/',
              timestamp: Date.now(),
              ...payload.data
            },
            actions: payload.actions || [
              {
                action: 'open',
                title: 'Відкрити щоденник'
              },
              {
                action: 'later',
                title: 'Нагадати пізніше'
              }
            ]
          });

          await webpush.sendNotification(pushSubscription, notificationPayload);
          console.log(`✅ Push notification sent to user ${userId}`);
        } catch (error: any) {
          console.error(`Failed to send push to subscription ${sub.id}:`, error);
          
          // Remove invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Removing invalid subscription ${sub.id}`);
            await storage.deletePushSubscription(sub.endpoint);
          }
        }
      });

      await Promise.allSettled(pushPromises);
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }

  static async sendReminderNotification(userId: number, principleTitle: string) {
    await this.sendToUser(userId, {
      title: 'Час для рефлексії 🪷',
      body: principleTitle,
      icon: '/logo-192.png',
      badge: '/logo-192.png',
      data: {
        type: 'reminder',
        principle: principleTitle
      },
      actions: [
        {
          action: 'open',
          title: 'Відкрити щоденник'
        },
        {
          action: 'later',
          title: 'Нагадати пізніше'
        }
      ]
    });
  }

  static async sendToAllUsers(payload: PushNotificationPayload) {
    if (!vapidConfigured) {
      console.log('Broadcast push notification skipped - VAPID keys not configured');
      return;
    }

    try {
      const users = await storage.getActiveUsers();
      
      const promises = users.map(user => this.sendToUser(user.id, payload));
      await Promise.allSettled(promises);
      
      console.log(`✅ Broadcast push notification sent to ${users.length} users`);
    } catch (error) {
      console.error('Error sending broadcast push notifications:', error);
    }
  }
}

export { PushService as pushService };