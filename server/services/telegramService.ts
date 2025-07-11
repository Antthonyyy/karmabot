import crypto from "crypto";
import { getGreeting } from '../telegram-bot.js';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export class TelegramService {
  private botToken: string;
  private botApiUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";
    this.botApiUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    if (!this.botToken) {
      console.warn("TELEGRAM_BOT_TOKEN not provided, Telegram functionality will be limited");
    }
  }

  // Verify Telegram Login Widget data
  verifyTelegramAuth(data: TelegramUser): boolean {
    if (!this.botToken) {
      console.error("Bot token not available for verification");
      return false;
    }

    const { hash, ...userData } = data;
    
    // Create data string for verification
    const dataKeys = Object.keys(userData).sort();
    const dataString = dataKeys
      .map(key => `${key}=${userData[key as keyof typeof userData]}`)
      .join('\n');
    
    // Create secret key
    const secretKey = crypto.createHash('sha256').update(this.botToken).digest();
    
    // Create expected hash
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataString)
      .digest('hex');
    
    return expectedHash === hash;
  }

  // Send message to user
  async sendMessage(chatId: string, message: string, options: any = {}): Promise<boolean> {
    if (!this.botToken) {
      console.warn("Cannot send message: Bot token not available");
      return false;
    }

    try {
      const response = await fetch(`${this.botApiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          ...options,
        }),
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async sendPrincipleReminder(chatId: string, principle: any, userName: string, reminderType: string = 'principle'): Promise<boolean> {
    let message = '';
    const greeting = getGreeting(userName);

    switch (reminderType) {
      case 'principle':
        message = `
${greeting}

🪷 **"${principle.title}"**

${principle.description}

💡 В додатку доступні персональні AI-рекомендації на основі ваших записей!
        `;
        break;

      case 'test':
        message = `
${greeting}

🧪 Тестове нагадування!

🪷 Поточний принцип: "${principle.title}"

${principle.description}

Це тестове повідомлення для перевірки налаштувань нагадувань. Якщо ви отримали це повідомлення, значить все працює правильно! 

✅ Система нагадувань активна
        `;
        break;

      default:
        message = `
${greeting}

🪷 Принцип: "${principle.title}"

${principle.description}

💭 Не забувайте практикувати цей принцип та записувати свої роздуми в щоденник.
        `;
    }

    return await this.sendMessage(chatId, message.trim());
  }

  async sendReflectionReminder(chatId: string, userName: string): Promise<boolean> {
    const message = `
🌙 Час для рефлексії, ${userName}!

📝 Підведіть підсумки дня:

💭 Питання для роздумів:
• Які принципи ви практикували сьогодні?
• Які ситуації допомогли вам краще зрозуміти їх?
• Що ви відчуваєте після дня практики?
• Які висновки можете зробити?

Поділіться своїми роздумами в щоденнику, щоб зберегти цінний досвід.

Солодких снів! ✨
    `;

    return await this.sendMessage(chatId, message.trim());
  }

  // Set webhook for bot
  async setWebhook(webhookUrl: string): Promise<boolean> {
    if (!this.botToken) {
      console.warn("Cannot set webhook: Bot token not available");
      return false;
    }

    try {
      const response = await fetch(`${this.botApiUrl}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
        }),
      });

      const result = await response.json();
      return result.ok;
    } catch (error) {
      console.error('Error setting webhook:', error);
      return false;
    }
  }

  // Process bot updates
  async processBotUpdate(update: any): Promise<void> {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (error) {
      console.error('Error processing bot update:', error);
    }
  }

  private async handleCallbackQuery(callbackQuery: any): Promise<void> {
    const chatId = callbackQuery.message.chat.id.toString();
    const callbackData = callbackQuery.data;
    const userId = callbackQuery.from.id;
    
    // Get user by telegram ID
    const user = await storage.getUserByTelegramId(userId.toString());
    if (!user) {
      await this.answerCallbackQuery(callbackQuery.id, 'Спочатку зареєструйтесь у веб-додатку');
      return;
    }

    // Parse callback data
    const [action, principleId, extra] = callbackData.split('_');
    const principleIdNum = parseInt(principleId);

    switch (action) {
      case 'done':
        await this.handlePrincipleDone(callbackQuery, user.id, principleIdNum);
        break;
      case 'journal':
        await this.handleJournalPrompt(callbackQuery, user.id, principleIdNum);
        break;
      case 'skip':
        await this.handleSkipPrinciple(callbackQuery, user.id, principleIdNum);
        break;
      case 'ai':
        await this.handleAIInsight(callbackQuery, user.id, principleIdNum, extra === 'refresh');
        break;
    }
  }

  private async handlePrincipleDone(callbackQuery: any, userId: number, principleId: number): Promise<void> {
    try {
      // Create automatic completion entry
      await storage.createJournalEntry({
        userId,
        principleId,
        content: '✅ Принцип виконано',
        mood: '😊',
        energyLevel: 7,
        isCompleted: true,
        source: 'telegram_quick'
      });

      // Update user stats
      await storage.updateUserStats(userId);

      // Update message
      await this.editMessage(
        callbackQuery.message.chat.id,
        callbackQuery.message.message_id,
        callbackQuery.message.text + '\n\n✅ **Відмічено як виконано!**',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '📝 Додати коментар', callback_data: `journal_${principleId}` }
            ]]
          }
        }
      );

      await this.answerCallbackQuery(callbackQuery.id, '✅ Принцип відмічено як виконано!');
    } catch (error) {
      console.error('Error handling principle done:', error);
      await this.answerCallbackQuery(callbackQuery.id, '❌ Помилка. Спробуйте ще раз');
    }
  }

  private async handleJournalPrompt(callbackQuery: any, userId: number, principleId: number): Promise<void> {
    try {
      const principle = await storage.getPrincipleByNumber(principleId);
      
      // Create or update user session with principle context
      await this.createUserSession(userId, callbackQuery.from.id, principleId);

      await this.answerCallbackQuery(callbackQuery.id);
      
      // Send new message asking for input
      await this.sendMessage(
        callbackQuery.message.chat.id,
        `📝 Поділіться своїми думками про **${principle?.title}**\n\nПросто напишіть текст, і я збережу його у вашому дневнику.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            force_reply: true,
            input_field_placeholder: 'Ваші роздуми про принцип...'
          }
        }
      );
    } catch (error) {
      console.error('Error handling journal prompt:', error);
      await this.answerCallbackQuery(callbackQuery.id, '❌ Помилка. Спробуйте ще раз');
    }
  }

  private async handleSkipPrinciple(callbackQuery: any, userId: number, principleId: number): Promise<void> {
    try {
      // Record skip for statistics
      await storage.createJournalEntry({
        userId,
        principleId,
        content: '⏭️ Принцип пропущено',
        mood: '😐',
        energyLevel: 5,
        isCompleted: false,
        isSkipped: true,
        source: 'telegram_quick'
      });

      await this.editMessage(
        callbackQuery.message.chat.id,
        callbackQuery.message.message_id,
        callbackQuery.message.text + '\n\n⏭️ **Принцип пропущено**',
        { parse_mode: 'Markdown' }
      );

      await this.answerCallbackQuery(callbackQuery.id, 'Принцип пропущено. Нічого страшного, спробуйте наступного разу!');
    } catch (error) {
      console.error('Error handling skip principle:', error);
      await this.answerCallbackQuery(callbackQuery.id, '❌ Помилка. Спробуйте ще раз');
    }
  }



  private async handleMessage(message: any): Promise<void> {
    const chatId = message.chat.id.toString();
    const text = message.text;
    const userId = message.from.id;

    // Handle commands
    if (text?.startsWith('/')) {
      await this.handleCommand(chatId, text, message.from);
      return;
    }

    // Handle regular messages as diary entries
    if (text && text.trim().length > 0) {
      await this.handleDiaryEntry(chatId, text, userId);
    }
  }

  private async handleCommand(chatId: string, command: string, user: any): Promise<void> {
    switch (command) {
      case '/start':
        await this.handleStartCommand(chatId, user);
        break;
      case '/my_principle':
        await this.handleMyPrincipleCommand(chatId, user.id);
        break;
      case '/stats':
        await this.handleStatsCommand(chatId, user.id);
        break;
      case '/settings':
        await this.handleSettingsCommand(chatId);
        break;
      default:
        await this.sendMessage(chatId, "Невідома команда. Використовуйте /start для початку.");
    }
  }

  private async handleStartCommand(chatId: string, user: any): Promise<void> {
    const message = `
Привіт, ${user.first_name}! 👋

Ласкаво просимо до Кармічного щоденника! 

🧘‍♂️ Тут ви можете:
• Отримувати нагадування про кармічні принципи  
• Вести щоденник духовного розвитку
• Відстежувати свій прогрес

🔗 Для початку роботи увійдіть у веб-додаток:
${process.env.FRONTEND_URL || 'http://localhost:5000'}

💬 Просто напишіть мені будь-що - це автоматично стане записом у вашому щоденнику!

🆔 Ваш Chat ID: <code>${chatId}</code>
    `.trim();

    await this.sendMessage(chatId, message);
  }

  private async handleMyPrincipleCommand(chatId: string, telegramId: number): Promise<void> {
    // This would need to query the database for user's current principle
    const message = `
🌟 <b>Ваш поточний принцип</b>

Щоб дізнатися свій поточний принцип, відкрийте веб-додаток:
${process.env.FRONTEND_URL || 'http://localhost:5000'}

📱 Там ви знайдете детальну інформацію та рекомендації.
    `.trim();

    await this.sendMessage(chatId, message);
  }

  private async handleStatsCommand(chatId: string, telegramId: number): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://karmichna-diary.vercel.app';
    
    const message = `
📊 <b>Ваша статистика</b>

Для перегляду детальної статистики відкрийте веб-додаток:
${frontendUrl}

📈 Там ви знайдете:
• Кількість днів поспіль
• Прогрес по принципах  
• Графіки активності

💡 Переглянути детальну аналітику та отримати персональні AI-поради можна в додатку!
    `.trim();

    await this.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '🌐 Відкрити додаток', url: frontendUrl }
        ]]
      }
    });
  }

  private async handleSettingsCommand(chatId: string): Promise<void> {
    const message = `
⚙️ <b>Налаштування</b>

Для зміни налаштувань відкрийте веб-додаток:
${process.env.FRONTEND_URL || 'http://localhost:5000'}

🔧 Там ви можете налаштувати:
• Час нагадувань
• Частоту повідомлень
• Мову інтерфейсу
    `.trim();

    await this.sendMessage(chatId, message);
  }

  private async handleDiaryEntry(chatId: string, text: string, telegramId: number): Promise<void> {
    try {
      // Find user by telegram ID
      const user = await storage.getUserByTelegramId(telegramId.toString());
      if (!user) {
        await this.sendMessage(chatId, 
          'Будь ласка, спочатку зареєструйтеся у веб-додатку: ' + process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://your-app.replit.app'
        );
        return;
      }

      // Get user's current principle (sequential practice)
      const currentPrincipleNumber = user.currentPrinciple || 1;
      const currentPrinciple = await storage.getPrincipleByNumber(currentPrincipleNumber);
      
      if (!currentPrinciple) {
        await this.sendMessage(chatId, 'Не вдалося знайти поточний принцип. Спробуйте пізніше.');
        return;
      }

      // Create diary entry with current principle
      const entry = await storage.createJournalEntry({
        userId: user.id,
        principleId: currentPrinciple.id,
        content: text,
        mood: null,
        energyLevel: null
      });

      // Send confirmation with current principle info
      await this.sendMessage(chatId, 
        `✅ *Запис збережено!*\n\n` +
        `📝 Ваш запис автоматично прив'язано до *Принципу ${currentPrincipleNumber}: ${currentPrinciple.title}* (ваш поточний принцип у послідовній практиці)\n\n` +
        `Якщо ваші роздуми стосувалися іншого принципу, ви можете змінити це у веб-додатку.`,
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      console.error('Error handling diary entry:', error);
      await this.sendMessage(chatId, 'Виникла помилка при збереженні запису. Спробуйте пізніше.');
    }
  }
}

export const telegramService = new TelegramService();
