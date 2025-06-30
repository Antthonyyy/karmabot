import cron from 'node-cron';
import { storage } from '../storage.js';
import { bot } from '../bot/index.js';

export class ReminderService {
  constructor() {
    this.initializeSchedules();
  }

  private initializeSchedules() {
    // Antidote reminders - 30 minutes before main reminders
    cron.schedule('30 8 * * *', async () => {
      await this.sendAntidoteReminders('morning');
    });

    cron.schedule('30 14 * * *', async () => {
      await this.sendAntidoteReminders('afternoon');
    });

    cron.schedule('30 19 * * *', async () => {
      await this.sendAntidoteReminders('evening');
    });

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

  private async sendAntidoteReminders(timeOfDay: 'morning' | 'afternoon' | 'evening') {
    const activeUsers = await storage.getActiveUsers();
    
    const timeMessages = {
      morning: '🌅 Доброго ранку!',
      afternoon: '☀️ Добрий день!',
      evening: '🌙 Добрий вечір!'
    };

    const timeAdvice = {
      morning: 'Перед початком дня подумай - чи є у тебе негативні думки, які можуть заважати? Створи антидот!',
      afternoon: 'У середині дня варто зупинитися і переосмислити. Чи потрібен тобі антидот від негативу?',
      evening: 'Перед сном добре очистити розум від негативних думок. Запиши антидот до того, що турбує.'
    };
    
    for (const user of activeUsers) {
      if (user.notificationType === 'daily' || user.notificationType === 'intensive') {
        try {
          await bot.sendMessage(
            parseInt(user.telegramId!),
            `${timeMessages[timeOfDay]} ${user.firstName}!\n\n` +
            `🛡️ Час для антидоту!\n\n` +
            `${timeAdvice[timeOfDay]}\n\n` +
            `Антидот - це позитивна думка або дія, яка нейтралізує негатив і повертає тебе до гармонії. 💚`,
            {
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🛡️ Додати антидот", callback_data: "add_antidote" }],
                  [{ text: "📱 Відкрити додаток", web_app: { url: process.env.FRONTEND_URL } }]
                ]
              }
            }
          );
        } catch (error) {
          console.error(`Failed to send antidote reminder to user ${user.id}:`, error);
        }
      }
    }
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