import cron from "node-cron";
import { telegramService } from "./telegramService.js";
import { storage } from "../storage.js";

export class ReminderService {
  private isRunning: boolean = false;

  constructor() {
    this.setupScheduler();
  }

  private setupScheduler(): void {
    // Run every minute to check for reminders (more precise timing)
    cron.schedule('* * * * *', async () => {
      if (this.isRunning) return;
      
      this.isRunning = true;
      try {
        await this.processReminders();
      } catch (error) {
        console.error('Error processing reminders:', error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log('Reminder service scheduled');
  }

  private async processReminders(): Promise<void> {
    try {
      // Get all active reminder schedules with user data
      const activeReminders = await storage.getActiveReminders();
      const now = new Date();
      
      for (const reminder of activeReminders) {
        if (await this.shouldSendReminderNow(reminder, now)) {
          await this.sendScheduledReminder(reminder);
        }
      }
    } catch (error) {
      console.error('Error in processReminders:', error);
    }
  }

  private async shouldSendReminder(user: any, currentHour: number): Promise<boolean> {
    // Check user's timezone and notification preferences
    const userHour = (currentHour + (user.timezoneOffset || 0)) % 24;
    
    // Skip if outside active hours (8 AM - 9 PM)
    if (userHour < 8 || userHour > 21) {
      return false;
    }

    // Check notification type
    switch (user.notificationType) {
      case 'daily':
        // Send once per day at preferred time
        return await this.isDailyReminderTime(user, userHour);
      
      case 'every_2':
        return userHour % 2 === 0;
      
      case 'every_2.5':
        // Approximate every 2.5 hours during active hours
        return [8, 10, 13, 15, 18, 20].includes(userHour);
      
      case 'every_3':
        return userHour % 3 === 0 && userHour >= 9;
      
      case 'every_4':
        return userHour % 4 === 0 && userHour >= 8;
      
      case 'custom':
        return await this.isCustomReminderTime(user, userHour);
      
      default:
        return false;
    }
  }

  private async isDailyReminderTime(user: any, userHour: number): Promise<boolean> {
    // Default to 9 AM if no custom time set
    const preferredHour = user.customTimes?.daily || 9;
    
    // Check if already sent today
    const lastSent = user.lastSent ? new Date(user.lastSent) : null;
    const today = new Date();
    
    if (lastSent && 
        lastSent.getDate() === today.getDate() && 
        lastSent.getMonth() === today.getMonth() &&
        lastSent.getFullYear() === today.getFullYear()) {
      return false;
    }
    
    return userHour === preferredHour;
  }

  private async isCustomReminderTime(user: any, userHour: number): Promise<boolean> {
    if (!user.customTimes?.times || !Array.isArray(user.customTimes.times)) {
      return false;
    }
    
    return user.customTimes.times.includes(userHour);
  }

  private async sendReminderToUser(user: any): Promise<void> {
    try {
      // Get current principle
      const principle = await storage.getPrincipleByNumber(user.currentPrinciple || 1);
      
      if (!principle) {
        console.error(`Principle not found for user ${user.id}`);
        return;
      }

      // Send reminder
      const success = await telegramService.sendPrincipleReminder(
        user.telegramChatId,
        principle,
        user.firstName
      );

      if (success) {
        // Update last sent time
        await storage.updateUserLastSent(user.id, new Date());
        console.log(`Reminder sent to user ${user.id} (${user.firstName})`);
      } else {
        console.error(`Failed to send reminder to user ${user.id}`);
      }
    } catch (error) {
      console.error(`Error sending reminder to user ${user.id}:`, error);
    }
  }

  // Manual trigger for testing
  async sendTestReminder(userId: number): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.telegramChatId) {
        return false;
      }

      await this.sendReminderToUser(user);
      return true;
    } catch (error) {
      console.error('Error sending test reminder:', error);
      return false;
    }
  }
}

export const reminderService = new ReminderService();
