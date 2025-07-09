import TelegramBot from "node-telegram-bot-api";
import { storage } from "../storage.js";
import { subscriptionService } from "../services/subscriptionService.js";
import { AIAssistant } from "../services/ai-assistant.js";
import { db } from "../db.js";
import { journalEntries, achievements } from "@shared/schema.js";
import { eq, gte, and } from "drizzle-orm";
import { getCleanFrontendUrl } from "../utils/env.js";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.log("⚠️ TELEGRAM_BOT_TOKEN not found - enhanced bot disabled");
}

const isWebhookMode = process.env.BOT_MODE === "webhook";
const bot = new TelegramBot(token, {
  polling: !isWebhookMode, // ⬅️ polling включается ТОЛЬКО если НЕ webhook
});

const aiAssistant = new AIAssistant();

// User sessions for multi-step interactions
const userSessions = new Map<string, any>();

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Доброго ранку, ${name}! 🌅`;
  if (hour < 18) return `Добрий день, ${name}! ☀️`;
  return `Добрий вечір, ${name}! 🌙`;
}

// Helper functions
async function getUserKarma(userId: number): Promise<number> {
  const entries = await db.query.journalEntries.findMany({
    where: eq(journalEntries.userId, userId),
  });
  return entries.reduce((sum, entry) => sum + (entry.karmaPoints || 0), 0);
}

async function getUserStreak(userId: number): Promise<number> {
  const stats = await storage.getUserStats(userId);
  return stats?.streakDays || 0;
}

async function getTodayKarma(userId: number): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entries = await db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.userId, userId),
      gte(journalEntries.createdAt, today),
    ),
  });

  return entries.reduce((sum, entry) => sum + (entry.karmaPoints || 0), 0);
}

async function getTotalEntries(userId: number): Promise<number> {
  const stats = await storage.getUserStats(userId);
  return stats?.totalEntries || 0;
}

async function checkAndNotifyAchievements(chatId: number, userId: number) {
  const totalEntries = await getTotalEntries(userId);
  const streak = await getUserStreak(userId);

  let newAchievement = null;

  if (totalEntries === 1) {
    newAchievement = {
      type: "first_entry",
      title: "🌟 Перший крок",
      description: "Ваш перший запис у щоденнику!",
    };
  } else if (streak === 7) {
    newAchievement = {
      type: "7_days_streak",
      title: "🔥 Тижнева серія",
      description: "7 днів поспіль!",
    };
  } else if (totalEntries === 10) {
    newAchievement = {
      type: "gratitude_master",
      title: "🙏 Майстер вдячності",
      description: "10 записів у щоденнику!",
    };
  }

  if (newAchievement) {
    await bot.sendMessage(
      chatId,
      `🏆 Нове досягнення!\n\n${newAchievement.title}\n${newAchievement.description}\n\nВітаємо! 🎉`,
    );
  }
}

// Main menu
async function showMainMenu(chatId: number, user: any, messageId?: number) {
  const greeting = getGreeting(user.firstName || "друже");
  const totalKarma = await getUserKarma(user.id);
  const streak = await getUserStreak(user.id);

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📝 Додати запис", callback_data: "add_entry" },
          { text: "📊 Статистика", callback_data: "stats" },
        ],
        [
          { text: "🏆 Досягнення", callback_data: "achievements" },
          { text: "💬 AI-порада", callback_data: "ai_advice" },
        ],
        [{ text: "💎 Підписка", callback_data: "subscription" }],
        [
          {
            text: "📱 Відкрити додаток",
            web_app: {
              url: getCleanFrontendUrl(),
            },
          },
        ],
      ],
    },
  };

  const message =
    `${greeting}\n\n` +
    `💫 Твоя карма: ${totalKarma} балів\n` +
    `🔥 Серія днів: ${streak}\n\n` +
    `Що бажаєш зробити?`;

  if (messageId) {
    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      ...options,
    });
  } else {
    await bot.sendMessage(chatId, message, options);
  }
}

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from?.id.toString();
  const firstName = msg.from?.first_name || "друже";

  if (!telegramId) {
    return bot.sendMessage(chatId, "❌ Помилка ідентифікації");
  }

  try {
    const existingUser = await storage.getUserByTelegramId(telegramId);

    if (existingUser) {
      await showMainMenu(chatId, existingUser);
    } else {
      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Почати реєстрацію",
                web_app: {
                  url: getCleanFrontendUrl(),
                },
              },
            ],
          ],
        },
      };

      return bot.sendMessage(
        chatId,
        `${getGreeting(firstName)}\n\n` +
          `🙏 Ласкаво просимо до Кармічного Щоденника!\n\n` +
          `Я допоможу тобі:\n` +
          `• 📝 Записувати добрі справи\n` +
          `• 📊 Відстежувати карму\n` +
          `• 💬 Отримувати AI-поради\n` +
          `• 🏆 Святкувати досягнення\n\n` +
          `Для початку роботи завершіть реєстрацію в додатку:`,
        options,
      );
    }
  } catch (error) {
    console.error("❌ Error in /start command:", error);
    bot.sendMessage(chatId, "❌ Сталася помилка. Спробуйте пізніше.");
  }
});

// Handle callback queries
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
  const chatId = msg?.chat.id;
  const telegramId = callbackQuery.from.id.toString();

  if (!chatId) return;

  try {
    await bot.answerCallbackQuery(callbackQuery.id);

    const user = await storage.getUserByTelegramId(telegramId);

    if (!user) {
      return bot.sendMessage(
        chatId,
        "❌ Користувача не знайдено. Використайте /start для реєстрації.",
      );
    }

    switch (data) {
      case "add_entry":
        const entryOptions = {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "💝 Доброта", callback_data: "entry_kindness" },
                { text: "🙏 Вдячність", callback_data: "entry_gratitude" },
              ],
              [
                { text: "🤝 Допомога", callback_data: "entry_help" },
                { text: "🛡️ Антидот", callback_data: "entry_antidote" }
              ],
              [{ text: "⬅️ Назад", callback_data: "main_menu" }],
            ],
          },
        };

        await bot.editMessageText("Обери категорію для свого запису:", {
          chat_id: chatId,
          message_id: msg.message_id,
          ...entryOptions,
        });
        break;

      case "entry_kindness":
      case "entry_gratitude":
      case "entry_help":
      case "entry_antidote":
        const category = data.replace("entry_", "");
        const categoryNames = {
          kindness: "Доброта 💝",
          gratitude: "Вдячність 🙏",
          help: "Допомога 🤝",
          antidote: "Антидот 🛡️",
        };

        userSessions.set(telegramId, {
          waitingForEntry: true,
          category: category,
        });

        const promptText = category === 'antidote' 
          ? `Опиши антидот до негативної думки або дії.\n` +
            `Що допоможе тобі перетворити негатив на позитив?`
          : `Опиши свою добру справу або за що ти вдячний.\n` +
            `Напиши повідомлення нижче:`;

        await bot.editMessageText(
          `Категорія: ${categoryNames[category]}\n\n` +
            promptText,
          {
            chat_id: chatId,
            message_id: msg.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: "❌ Скасувати", callback_data: "main_menu" }],
              ],
            },
          },
        );
        break;

      case "stats":
        const userStats = await storage.getUserStats(user.id);
        const totalKarma = await getUserKarma(user.id);
        const streak = await getUserStreak(user.id);
        const todayKarma = await getTodayKarma(user.id);
        const totalEntries = await getTotalEntries(user.id);

        const statsMessage =
          `📊 Твоя статистика:\n\n` +
          `💫 Загальна карма: ${totalKarma} балів\n` +
          `🔥 Серія днів: ${streak}\n` +
          `📅 Карма сьогодні: ${todayKarma} балів\n` +
          `📝 Всього записів: ${totalEntries}\n` +
          `😊 Середній настрій: ${(userStats?.averageMood || 0).toFixed(1)}/10\n` +
          `⚡ Середня енергія: ${(userStats?.averageEnergy || 0).toFixed(1)}/10\n\n` +
          `Продовжуй у тому ж дусі! 🌟`;

        await bot.editMessageText(statsMessage, {
          chat_id: chatId,
          message_id: msg.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📈 Детальна статистика",
                  web_app: { url: `${getCleanFrontendUrl()}/analytics` },
                },
              ],
              [{ text: "🔙 Назад", callback_data: "main_menu" }],
            ],
          },
        });
        break;

      case "achievements":
        const userAchievements = await db.query.achievements.findMany({
          where: eq(achievements.userId, user.id),
        });

        const achievementTitles = {
          first_entry: "🌟 Перший крок",
          "7_days_streak": "🔥 Тижнева серія",
          gratitude_master: "🙏 Майстер вдячності",
          karma_collector: "🏆 Збирач карми",
          month_champion: "📅 Чемпіон місяця",
          mood_master: "😊 Майстер настрою",
        };

        let achievementsMessage = "🏆 Твої досягнення:\n\n";

        if (userAchievements.length === 0) {
          achievementsMessage +=
            "Поки що немає досягнень.\nПродовжуй вести щоденник! 💪";
        } else {
          userAchievements.forEach((achievement) => {
            const title =
              achievementTitles[achievement.type] || achievement.type;
            achievementsMessage += `${title}\n`;
          });
          achievementsMessage += `\n✨ Відкрито: ${userAchievements.length} досягнень`;
        }

        await bot.editMessageText(achievementsMessage, {
          chat_id: chatId,
          message_id: msg.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🏆 Всі досягнення",
                  web_app: { url: `${getCleanFrontendUrl()}/dashboard` },
                },
              ],
              [{ text: "🔙 Назад", callback_data: "main_menu" }],
            ],
          },
        });
        break;

      case "ai_advice":
        // Check subscription
        const subscription = await subscriptionService.getUserSubscription(
          user.id,
        );

        if (
          !subscription.features.aiRequests ||
          subscription.features.aiRequests === 0
        ) {
          await bot.editMessageText(
            "💎 AI-поради доступні тільки для підписок Plus та Pro.\n\n" +
              "Оформи підписку, щоб отримувати персоналізовані поради від AI!",
            {
              chat_id: chatId,
              message_id: msg.message_id,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "💎 Оформити підписку",
                      web_app: {
                        url: `${getCleanFrontendUrl()}/subscriptions`,
                      },
                    },
                  ],
                  [{ text: "🔙 Назад", callback_data: "main_menu" }],
                ],
              },
            },
          );
          return;
        }

        // Show loading
        await bot.editMessageText("🤔 AI генерує пораду...", {
          chat_id: chatId,
          message_id: msg.message_id,
        });

        try {
          const advice = await aiAssistant.analyzeUserEntries(user.id, "uk");

          await bot.editMessageText(
            `💡 AI-порада для тебе:\n\n${advice}\n\n✨ Продовжуй творити добро!`,
            {
              chat_id: chatId,
              message_id: msg.message_id,
              reply_markup: {
                inline_keyboard: [
                  [{ text: "💡 Ще порада", callback_data: "ai_advice" }],
                  [{ text: "🔙 Назад", callback_data: "main_menu" }],
                ],
              },
            },
          );
        } catch (error) {
          await bot.editMessageText(
            "❌ Не вдалося отримати пораду. Спробуй пізніше.\n\n" +
              "Можливо, вичерпано ліміт AI-запитів.",
            {
              chat_id: chatId,
              message_id: msg.message_id,
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🔙 Назад", callback_data: "main_menu" }],
                ],
              },
            },
          );
        }
        break;

      case "subscription":
        const currentSubscription =
          await subscriptionService.getUserSubscription(user.id);

        let subscriptionMessage = "💎 Твоя підписка:\n\n";

        if (currentSubscription.plan === "none") {
          subscriptionMessage +=
            "У тебе безкоштовний план.\n\n" +
            "Переваги платних підписок:\n" +
            "• 🌟 Light: Розширена статистика\n" +
            "• ⭐ Plus: AI-поради (5/місяць)\n" +
            "• 💎 Pro: AI-чат (необмежено)";
        } else {
          const planNames = {
            light: "🌟 Light",
            plus: "⭐ Plus",
            pro: "💎 Pro",
          };

          subscriptionMessage += `План: ${planNames[currentSubscription.plan]}\n`;

          if (currentSubscription.endDate) {
            subscriptionMessage += `Діє до: ${new Date(currentSubscription.endDate).toLocaleDateString("uk-UA")}\n\n`;
          }

          if (currentSubscription.plan === "plus") {
            subscriptionMessage += "Ти маєш доступ до AI-порад! 💡";
          } else if (currentSubscription.plan === "pro") {
            subscriptionMessage += "Ти маєш повний доступ до всіх функцій! 🚀";
          }
        }

        await bot.editMessageText(subscriptionMessage, {
          chat_id: chatId,
          message_id: msg.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "💎 Керувати підпискою",
                  web_app: { url: `${getCleanFrontendUrl()}/subscriptions` },
                },
              ],
              [{ text: "🔙 Назад", callback_data: "main_menu" }],
            ],
          },
        });
        break;

      case "main_menu":
        await showMainMenu(chatId, user, msg.message_id);
        break;
    }
  } catch (error) {
    console.error("❌ Error handling callback query:", error);
    bot.sendMessage(chatId, "❌ Сталася помилка. Спробуйте пізніше.");
  }
});

// Handle text messages for journal entries
bot.on("message", async (msg) => {
  if (msg.text && !msg.text.startsWith("/")) {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();

    if (!telegramId) return;

    const session = userSessions.get(telegramId);

    if (session?.waitingForEntry) {
      try {
        const user = await storage.getUserByTelegramId(telegramId);

        if (!user) {
          await bot.sendMessage(
            chatId,
            "❌ Користувача не знайдено. Використайте /start",
          );
          return;
        }

        const category = session.category;
        const description = msg.text;

        // Determine karma points
        const karmaPoints =
          {
            kindness: 10,
            gratitude: 5,
            help: 15,
          }[category] || 5;

        // Add journal entry
        await storage.createJournalEntry({
          userId: user.id,
          principleId: user.currentPrinciple,
          category,
          description,
          mood: 7, // Default mood
          energy: 7, // Default energy
          karmaPoints,
        });

        // Update user stats
        await storage.updateUserStats(user.id);

        // Check achievements
        await checkAndNotifyAchievements(chatId, user.id);

        // Clear session
        userSessions.delete(telegramId);

        const totalKarma = await getUserKarma(user.id);

        await bot.sendMessage(
          chatId,
          `✅ Запис додано!\n\n` +
            `Ти отримав ${karmaPoints} балів карми.\n` +
            `Твоя загальна карма: ${totalKarma} балів\n\n` +
            `Продовжуй творити добро! 🌟`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "📝 Додати ще", callback_data: "add_entry" },
                  { text: "🏠 Головне меню", callback_data: "main_menu" },
                ],
              ],
            },
          },
        );
      } catch (error) {
        console.error("❌ Error adding journal entry:", error);
        await bot.sendMessage(
          chatId,
          "❌ Не вдалося додати запис. Спробуйте пізніше.",
        );
        userSessions.delete(telegramId);
      }
    }
  }
});

// Handle errors
bot.on("error", (error) => {
  console.error("❌ Telegram bot error:", error);
});

console.log("🤖 Telegram bot started successfully");

export function initBot() {
  // Bot initialization is already done above
  global.telegramBotInstance = bot;
  return bot;
}

export { bot };
