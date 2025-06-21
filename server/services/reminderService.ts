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

  private async shouldSendReminderNow(reminder: any, now: Date): Promise<boolean> {
    const user = reminder.user;
    
    // Check if user has Telegram connected
    if (!user.telegramChatId) {
      return false;
    }

    // Calculate user's local time based on timezone
    const userTime = this.getUserLocalTime(user, now);
    const currentTimeString = this.formatTime(userTime);
    
    // Check if current time matches reminder time
    if (!this.isTimeMatch(currentTimeString, reminder.time)) {
      return false;
    }

    // Check if we haven't already sent this type of reminder today
    return await this.shouldSendAtThisTime(user, reminder.type);
  }

  private getUserLocalTime(user: any, utcTime: Date): Date {
    // Default to Kiev timezone if not specified
    const timezone = user.timezone || 'Europe/Kiev';
    
    try {
      // Convert UTC time to user's timezone
      return new Date(utcTime.toLocaleString('en-US', { timeZone: timezone }));
    } catch (error) {
      console.error(`Invalid timezone ${timezone}, using Kiev time`);
      return new Date(utcTime.toLocaleString('en-US', { timeZone: 'Europe/Kiev' }));
    }
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5); // HH:MM format
  }

  private isTimeMatch(currentTime: string, targetTime: string): boolean {
    // Allow 1-minute window for matching
    const current = this.timeToMinutes(currentTime);
    const target = this.timeToMinutes(targetTime);
    
    return Math.abs(current - target) <= 1;
  }

  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async shouldSendAtThisTime(user: any, reminderType: string): Promise<boolean> {
    // For principle reminders, check if we haven't sent too many today
    if (reminderType === 'principle') {
      const today = new Date().toISOString().split('T')[0];
      
      // Count how many principles sent today
      const sentToday = await storage.getPrinciplesSentToday(user.id, today);
      
      // Don't send more than user's daily limit
      if (sentToday >= (user.dailyPrinciplesCount || 2)) {
        return false;
      }
    }
    
    // For reflection reminders, check if we haven't already sent today
    if (reminderType === 'reflection') {
      if (user.lastReminderSent) {
        const lastSent = new Date(user.lastReminderSent);
        const userTime = this.getUserLocalTime(user, new Date());
        
        // If we sent a reminder today, don't send another reflection
        if (lastSent.toDateString() === userTime.toDateString()) {
          return false;
        }
      }
    }

    return true;
  }

  private async sendScheduledReminder(reminder: any): Promise<void> {
    try {
      const user = reminder.user;
      const userTime = this.getUserLocalTime(user, new Date());
      const currentTimeString = this.formatTime(userTime);
      
      if (reminder.type === 'principle') {
        await this.sendPrincipleReminder(user, currentTimeString);
      } else if (reminder.type === 'reflection') {
        await this.sendReflectionReminder(user, currentTimeString);
      }
    } catch (error) {
      console.error(`Error sending scheduled reminder:`, error);
    }
  }

  private async sendPrincipleReminder(user: any, timeString: string): Promise<void> {
    try {
      // Get next principle for user
      const principle = await storage.getNextPrincipleForUser(user.id);
      if (!principle) {
        console.error(`No principle found for user ${user.id}`);
        return;
      }

      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Count existing principles for today
      const existingCount = await storage.getPrinciplesSentToday(user.id, today);
      const principleOrder = existingCount + 1;

      // Send reminder via Telegram
      const success = await telegramService.sendPrincipleReminder(
        user.telegramChatId,
        principle,
        user.firstName,
        'principle'
      );

      if (success) {
        // Create user principle record
        await storage.createUserPrinciple({
          userId: user.id,
          principleId: principle.id,
          date: today,
          principleOrder,
          reminderTime: timeString,
          completed: false,
        });

        // Update last reminder sent timestamp
        await storage.updateUserLastSent(user.id, new Date());
        console.log(`Principle reminder sent to user ${user.id} (${user.firstName}) at ${timeString}`);
      }
    } catch (error) {
      console.error(`Error sending principle reminder:`, error);
    }
  }

  private async sendReflectionReminder(user: any, timeString: string): Promise<void> {
    try {
      // Send reflection reminder via Telegram
      const success = await telegramService.sendReflectionReminder(
        user.telegramChatId,
        user.firstName
      );

      if (success) {
        // Update last reminder sent timestamp
        await storage.updateUserLastSent(user.id, new Date());
        console.log(`Reflection reminder sent to user ${user.id} (${user.firstName}) at ${timeString}`);
      }
    } catch (error) {
      console.error(`Error sending reflection reminder:`, error);
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
