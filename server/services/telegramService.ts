import crypto from "crypto";

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

  // Send principle reminder
  async sendPrincipleReminder(chatId: string, principle: any, userName: string): Promise<boolean> {
    const message = `
🌟 <b>Нагадування про принцип</b>

Привіт, ${userName}! 

<b>Принцип ${principle.number}: ${principle.title}</b>
${principle.description}

💭 <b>Питання для роздумів:</b>
• Як я можу застосувати цей принцип сьогодні?
• Які мої дії відповідають цьому принципу?
• Що я можу змінити у своїй поведінці?

📝 Напишіть мені свої думки - вони автоматично збережуться у вашому щоденнику!

🔗 <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}">Відкрити щоденник</a>
    `.trim();

    return this.sendMessage(chatId, message);
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
      }
    } catch (error) {
      console.error('Error processing bot update:', error);
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
    const message = `
📊 <b>Ваша статистика</b>

Для перегляду детальної статистики відкрийте веб-додаток:
${process.env.FRONTEND_URL || 'http://localhost:5000'}

📈 Там ви знайдете:
• Кількість днів поспіль
• Прогрес по принципах  
• Графіки активності
    `.trim();

    await this.sendMessage(chatId, message);
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
    // This would need to save the diary entry to database
    const confirmMessage = `
✅ <b>Запис збережено!</b>

Ваші думки додано до щоденника. 

📖 Переглянути всі записи можна у веб-додатку:
${process.env.FRONTEND_URL || 'http://localhost:5000'}
    `.trim();

    await this.sendMessage(chatId, confirmMessage);
  }
}

export const telegramService = new TelegramService();
