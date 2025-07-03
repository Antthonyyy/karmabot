import cron from 'node-cron';
import { db } from '../db';
import { subscriptions } from '../../shared/schema';
import { sql } from 'drizzle-orm';

export function initTrialExpirationCron() {
  // Run every day at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    try {
      const result = await db
        .update(subscriptions)
        .set({ status: 'expired' })
        .where(sql`${subscriptions.plan} = 'trial' AND ${subscriptions.expiresAt} < now()`);
      
      console.log('[cron] trialExpiration executed', result);
    } catch (error) {
      console.error('[cron] trialExpiration error:', error);
    }
  });
  
  console.log('🕐 Trial expiration cron job initialized');
}