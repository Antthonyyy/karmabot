import TelegramBot from "node-telegram-bot-api";
import { authorizeSession } from "./auth-sessions.js";

const token = process.env.TELEGRAM_BOT_TOKEN;

// Time-based personalized greetings
function getGreeting(name: string): string {
  const now = new Date();
  const hour = now.getHours();

  const morningGreetings = [
    `Доброе утро, ${name}! ☀️ Готовы начать день с благодарности?`,
    `Привет, ${name}! 🌅 Новый день — новые возможности для роста!`,
    `Утро, ${name}! ✨ Давайте наполним этот день осознанностью`,
    `Доброе утро, ${name}! 🌻 Время для утренних размышлений`,
  ];

  const dayGreetings = [
    `Добрый день, ${name}! 🌞 Как проходит ваша практика?`,
    `Привет, ${name}! ⭐ Время для дневной рефлексии`,
    `День добрый, ${name}! 🌈 Продолжаем работу над собой`,
    `Здравствуйте, ${name}! 💫 Момент для осознанности`,
  ];

  const eveningGreetings = [
    `Добрый вечер, ${name}! 🌙 Время подвести итоги дня`,
    `Вечер, ${name}! 🌟 Как прошел ваш день с принципами?`,
    `Привет, ${name}! 🌆 Время для вечерних размышлений`,
    `Добрый вечер, ${name}! ✨ Завершаем день с благодарностью`,
  ];

  let greetings: string[];

  if (hour >= 5 && hour < 12) {
    greetings = morningGreetings;
  } else if (hour >= 12 && hour < 18) {
    greetings = dayGreetings;
  } else if (hour >= 18 && hour < 23) {
    greetings = eveningGreetings;
  } else {
    greetings = [`Привет, ${name}! 🌙 Поздний час для размышлений`];
  }

  return greetings[Math.floor(Math.random() * greetings.length)];
}

let bot: TelegramBot | null = null;

async function initializeBot() {
  if (!token) {
    console.log("TELEGRAM_BOT_TOKEN not provided, bot disabled");
    return null;
  }

  if (process.env.BOT_MODE === 'off') {
    console.log("Bot disabled in development (BOT_MODE=off)");
    return null;
  }

  // Use webhook in production if TELEGRAM_WEBHOOK_URL is set, otherwise use polling
  if (process.env.TELEGRAM_WEBHOOK_URL) {
    bot = new TelegramBot(token, { polling: false });
    const webhookUrl = process.env.WEBHOOK_SECRET 
      ? `${process.env.TELEGRAM_WEBHOOK_URL}/api/telegram/webhook?secret=${process.env.WEBHOOK_SECRET}`
      : `${process.env.TELEGRAM_WEBHOOK_URL}/api/telegram/webhook`;
    await bot.setWebHook(webhookUrl);
    console.log("Telegram bot started in webhook mode");
  } else {
    bot = new TelegramBot(token, { polling: true });
    console.log("Telegram bot started in polling mode");
    
    // Log errors only for polling mode
    bot.on("polling_error", (error: any) => {
      console.error("Telegram bot polling error:", error);
    });
  }

  // Handle /start command with auth_SESSION_ID parameter
  bot.onText(/\/start auth_(.+)/, async (msg: any, match: any) => {
    console.log('🤖 BOT RECEIVED AUTH MESSAGE:', msg.text, 'FROM:', msg.from);
    const chatId = msg.chat.id;
    const sessionId = match[1];
    const user = msg.from;

    try {
      const success = authorizeSession(sessionId, {
        telegramId: user.id.toString(),
        firstName: user.first_name,
        lastName: user.last_name || null,
        username: user.username || null,
      });

      if (success) {
        await bot!.sendMessage(
          chatId,
          "✅ Авторизація успішна!\n\n" +
            "Поверніться на сайт Кармічний щоденник.\n" +
            "Вікно авторизації оновиться автоматично.",
          { parse_mode: "HTML" },
        );
      } else {
        await bot!.sendMessage(
          chatId,
          "❌ Помилка авторизації\n\n" +
            "Сесія не знайдена або застаріла.\n" +
            "Спробуйте ще раз на сайті.",
          { parse_mode: "HTML" },
        );
      }
    } catch (error) {
      console.error('❌ Start command error:', error);
      await bot!.sendMessage(
        chatId,
        "❌ Сталася помилка під час авторизації.\n\n" +
          "Спробуйте ще раз або зверніться до підтримки.",
        { parse_mode: "HTML" },
      );
    }
  });

  // Handle regular /start command (without parameters)
  bot.onText(/^\/start$/, async (msg: any) => {
    console.log('🤖 BOT RECEIVED REGULAR START:', msg.text, 'FROM:', msg.from);
    const chatId = msg.chat.id;
    await bot!.sendMessage(
      chatId,
      "👋 Вітаю в Кармічному щоденнику!\n\n" +
        "Цей бот допоможе вам:\n" +
        "• Авторизуватися на сайті\n" +
        "• Отримувати нагадування про принципи\n\n" +
        "Для авторизації перейдіть на сайт та натисніть 'Увійти через Telegram'",
      { parse_mode: "HTML" },
    );
  });

  return bot;
}

// Initialize bot
initializeBot();

export default bot;
export { getGreeting };