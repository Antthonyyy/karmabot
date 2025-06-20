import TelegramBot from 'node-telegram-bot-api';
import { authorizeSession } from './auth-sessions.js';

// Use the correct bot token
const token = '8034922821:AAEBc1Iw-bv33Wx-VpudozESPJVsX3FCKwA';

// Create bot instance  
const bot = new TelegramBot(token, { polling: true });

// Log errors
bot.on('polling_error', (error) => {
  console.error('Telegram bot polling error:', error);
});

// Handle /start command with auth_SESSION_ID parameter
bot.onText(/\/start auth_(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const sessionId = match[1];
  const user = msg.from;
  
  // Authorize session
  const success = authorizeSession(sessionId, {
    telegramId: user.id.toString(),
    firstName: user.first_name,
    lastName: user.last_name || null,
    username: user.username || null
  });
  
  if (success) {
    // Send success message
    await bot.sendMessage(chatId, 
      "✅ Авторизація успішна!\n\n" +
      "Поверніться на сайт Кармічний щоденник.\n" +
      "Вікно авторизації оновиться автоматично.",
      {
        parse_mode: 'HTML'
      }
    );
  } else {
    // If session not found or expired
    await bot.sendMessage(chatId,
      "❌ Помилка авторизації\n\n" +
      "Сесія не знайдена або застаріла.\n" +
      "Спробуйте ще раз на сайті.",
      {
        parse_mode: 'HTML'
      }
    );
  }
});

// Handle regular /start command (without parameters)
bot.onText(/^\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId,
    "👋 Вітаю в Кармічному щоденнику!\n\n" +
    "Цей бот допоможе вам:\n" +
    "• Авторизуватися на сайті\n" +
    "• Отримувати нагадування про принципи\n\n" +
    "Для авторизації перейдіть на сайт та натисніть 'Увійти через Telegram'",
    {
      parse_mode: 'HTML'
    }
  );
});

console.log('Telegram bot started successfully');

export default bot;