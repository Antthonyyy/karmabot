import cron from 'node-cron';
import { storage } from '../storage.js';
import { bot } from '../bot/index.js';

export class ReminderService {
  constructor() {
    this.initializeSchedules();
  }

  private initializeSchedules() {
    // Morning reminders (9:00 AM)
    cron.schedule('0 9 * * *', async () => {
      await this.sendMorningReminders();
    });

    // Afternoon reminders (3:00 PM)
    cron.schedule('0 15 * * *', async () => {
      await this.sendAfternoonReminders();
    });

    // Evening reminders (8:00 PM)
    cron.schedule('0 20 * * *', async () => {
      await this.sendEveningReminders();
    });

    console.log('🔔 Reminder service scheduled');
  }

  private async sendMorningReminders() {
    const activeUsers = await storage.getActiveUsers();
    
    for (const user of activeUsers) {
      if (user.notificationType === 'daily' || user.notificationType === 'intensive') {
        try {
          await bot.sendMessage(
            parseInt(user.telegramId!),
            `🌅 Доброго ранку, ${user.firstName}!\n\n` +
            `Новий день - нова можливість творити добро.\n` +
            `Сьогоднішній принцип: ${user.currentPrinciple}/10\n\n` +
            `Спробуй сьогодні зробити щонайменше одну добру справу! 💝`,
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "📝 Додати запис", callback_data: "add_entry" }],
                  [{ text: "📱 Відкрити додаток", web_app: { url: process.env.FRONTEND_URL } }]
                ]
              }
            }
          );
        } catch (error) {
          console.error(`Failed to send morning reminder to user ${user.id}:`, error);
        }
      }
    }
  }

  private async sendAfternoonReminders() {
    const activeUsers = await storage.getActiveUsers();
    
    for (const user of activeUsers) {
      if (user.notificationType === 'intensive') {
        try {
          await bot.sendMessage(
            parseInt(user.telegramId!),
            `☀️ ${user.firstName}, як проходить день?\n\n` +
            `Час для короткої рефлексії:\n` +
            `• Що доброго ти вже зробив сьогодні?\n` +
            `• Що можеш покращити у другій половині дня?\n\n` +
            `Записуй свої думки в щоденник! 📖`,
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "📊 Мій прогрес", callback_data: "stats" }],
                  [{ text: "💬 AI-порада", callback_data: "ai_advice" }]
                ]
              }
            }
          );
        } catch (error) {
          console.error(`Failed to send afternoon reminder to user ${user.id}:`, error);
        }
      }
    }
  }

  private async sendEveningReminders() {
    const activeUsers = await storage.getActiveUsers();
    
    for (const user of activeUsers) {
      if (user.notificationType === 'daily' || user.notificationType === 'intensive') {
        try {
          const userStats = await storage.getUserStats(user.id);
          const todayEntries = userStats?.totalEntries || 0;
          
          let message = `🌙 Добрий вечір, ${user.firstName}!\n\n`;
          
          if (todayEntries === 0) {
            message += `Сьогодні ти ще не додав записів у щоденник.\n` +
              `Згадай - що доброго сталося сьогодні?\n` +
              `Навіть маленька справа має значення! ✨`;
          } else {
            message += `Сьогодні ти зробив ${todayEntries} записів! 👏\n` +
              `Чудова робота з розвитку карми.\n` +
              `Побажай собі добраніч і готуйся до нового дня! 🌟`;
          }

          await bot.sendMessage(
            parseInt(user.telegramId!),
            message,
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "📝 Додати запис", callback_data: "add_entry" }],
                  [{ text: "🏆 Мої досягнення", callback_data: "achievements" }]
                ]
              }
            }
          );
        } catch (error) {
          console.error(`Failed to send evening reminder to user ${user.id}:`, error);
        }
      }
    }
  }

  async sendCustomReminder(userId: number, message: string) {
    try {
      const user = await storage.getUser(userId);
      if (user && user.telegramId) {
        await bot.sendMessage(
          parseInt(user.telegramId!),
          message,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "📱 Відкрити додаток", web_app: { url: process.env.FRONTEND_URL } }]
              ]
            }
          }
        );
      }
    } catch (error) {
      console.error(`Failed to send custom reminder to user ${userId}:`, error);
    }
  }
}

export const reminderService = new ReminderService();