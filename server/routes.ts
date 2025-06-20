import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { authenticateToken, optionalAuth, handleTelegramAuth, type AuthRequest, generateToken } from "./auth.js";
import { telegramService } from "./services/telegramService.js";
import { reminderService } from "./services/reminderService.js";
import { insertJournalEntrySchema } from "@shared/schema.js";
import { createSession, checkSession, deleteSession } from "./auth-sessions.js";
import "./telegram-bot.js"; // Import to start the bot

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize principles data
  await initializePrinciples();

  // Auth routes - Session-based Telegram authentication
  app.post('/api/auth/telegram/start-session', (req, res) => {
    try {
      const sessionId = createSession();
      res.json({ sessionId });
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });

  app.get('/api/auth/check-session/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = checkSession(sessionId);
      
      if (!session || !session.authorized) {
        return res.json({ authorized: false });
      }
      
      // Find or create user in database
      if (!session.userData) {
        return res.status(400).json({ error: 'Session userData missing' });
      }
      
      let user = await storage.getUserByTelegramId(session.userData.telegramId);
      let isNewUser = false;
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          firstName: session.userData.firstName,
          lastName: session.userData.lastName,
          username: session.userData.username,
          telegramId: session.userData.telegramId,
          telegramChatId: session.userData.telegramId,
          currentPrinciple: 1,
          notificationType: 'daily',
          language: 'uk',
          timezoneOffset: 0
        });
        isNewUser = true;
        
        // Initialize user stats
        await storage.initializeUserStats(user.id);
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Delete used session
      deleteSession(sessionId);
      
      res.json({
        authorized: true,
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          currentPrinciple: user.currentPrinciple,
          telegramConnected: true,
          telegramId: user.telegramId
        },
        isNewUser
      });
    } catch (error) {
      console.error('Error checking session:', error);
      res.status(500).json({ error: 'Failed to check session' });
    }
  });

  // Keep old callback for compatibility
  app.post('/api/auth/telegram/callback', async (req, res) => {
    try {
      const telegramData = req.body;
      
      if (!telegramData || !telegramData.id) {
        return res.status(400).json({ message: 'Invalid Telegram data' });
      }

      const { user, token, isNewUser } = await handleTelegramAuth(telegramData);

      res.json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          currentPrinciple: user.currentPrinciple,
          telegramConnected: !!user.telegramChatId,
        },
        token,
        isNewUser
      });
    } catch (error) {
      console.error('Telegram auth error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Authentication failed' });
    }
  });

  // User routes
  app.get('/api/user/me', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const stats = await storage.getUserStats(user.id);
      
      res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        currentPrinciple: user.currentPrinciple,
        notificationType: user.notificationType,
        customTimes: user.customTimes,
        language: user.language,
        telegramConnected: !!user.telegramChatId,
        stats: stats || {
          streakDays: 0,
          totalEntries: 0,
          currentCycle: 1,
          principleProgress: {}
        }
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/user/settings', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const { notificationType, customTimes, language, timezoneOffset } = req.body;
      
      const updatedUser = await storage.updateUser(user.id, {
        notificationType,
        customTimes,
        language,
        timezoneOffset
      });

      res.json({
        message: 'Settings updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/user/next-principle', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const nextPrinciple = (user.currentPrinciple % 10) + 1;
      
      const updatedUser = await storage.updateUser(user.id, {
        currentPrinciple: nextPrinciple
      });

      res.json({
        message: 'Principle updated successfully',
        currentPrinciple: nextPrinciple
      });
    } catch (error) {
      console.error('Error updating principle:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Principles routes
  app.get('/api/principles', async (req, res) => {
    try {
      const principles = await storage.getAllPrinciples();
      res.json(principles);
    } catch (error) {
      console.error('Error fetching principles:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/principles/:number', async (req, res) => {
    try {
      const number = parseInt(req.params.number);
      if (isNaN(number) || number < 1 || number > 10) {
        return res.status(400).json({ message: 'Invalid principle number' });
      }

      const principle = await storage.getPrincipleByNumber(number);
      if (!principle) {
        return res.status(404).json({ message: 'Principle not found' });
      }

      res.json(principle);
    } catch (error) {
      console.error('Error fetching principle:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Journal routes
  app.get('/api/journal/entries', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const entries = await storage.getUserJournalEntries(user.id, limit, offset);
      res.json(entries);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/journal/entries', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const validatedData = insertJournalEntrySchema.parse({
        ...req.body,
        userId: user.id,
        principleId: user.currentPrinciple
      });

      const entry = await storage.createJournalEntry(validatedData);
      
      // Update user stats
      await storage.updateUserStats(user.id);

      res.status(201).json(entry);
    } catch (error) {
      console.error('Error creating journal entry:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/journal/entries/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const entryId = parseInt(req.params.id);
      
      const entry = await storage.getJournalEntry(entryId);
      if (!entry || entry.userId !== user.id) {
        return res.status(404).json({ message: 'Journal entry not found' });
      }

      res.json(entry);
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/journal/entries/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const entryId = parseInt(req.params.id);
      
      const entry = await storage.getJournalEntry(entryId);
      if (!entry || entry.userId !== user.id) {
        return res.status(404).json({ message: 'Journal entry not found' });
      }

      const { content, mood, energyLevel } = req.body;
      const updatedEntry = await storage.updateJournalEntry(entryId, {
        content,
        mood,
        energyLevel
      });

      res.json(updatedEntry);
    } catch (error) {
      console.error('Error updating journal entry:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Telegram webhook
  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      await telegramService.processBotUpdate(req.body);
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error processing Telegram webhook:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get bot info
  app.get('/api/bot/info', async (req, res) => {
    try {
      // Get bot info from Telegram API
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return res.status(500).json({ message: 'Bot token not configured' });
      }

      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await response.json();
      
      if (data.ok) {
        res.json({
          username: data.result.username,
          name: data.result.first_name
        });
      } else {
        // Fallback
        res.json({
          username: 'karmics_diary_bot',
          name: 'Кармічний Щоденник'
        });
      }
    } catch (error) {
      console.error('Error getting bot info:', error);
      res.json({
        username: 'karmics_diary_bot',
        name: 'Кармічний Щоденник'
      });
    }
  });

  // Test reminder endpoint (for development)
  app.post('/api/test/reminder/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const success = await reminderService.sendTestReminder(userId);
      
      res.json({ 
        success,
        message: success ? 'Test reminder sent' : 'Failed to send test reminder'
      });
    } catch (error) {
      console.error('Error sending test reminder:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Initialize principles data
async function initializePrinciples() {
  const principlesData = [
    {
      number: 1,
      title: "Не шкодь іншим",
      description: "Захист життя / Незбереження життя",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/1",
      reflections: [
        "Як я можу сьогодні проявити турботу про живі істоти?",
        "Які мої дії впливають на оточуючий світ?",
        "Чи можу я замінити шкідливі звички на корисні?"
      ],
      practicalSteps: [
        "Обирайте екологічні продукти",
        "Проявляйте доброту до тварин",
        "Підтримуйте чистоту довкілля"
      ]
    },
    {
      number: 2,
      title: "Говори правду",
      description: "Щедрість / Крадіжки. Збереження чужого майна / Пошкодження чужого майна",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/2",
      reflections: [
        "Чи говорю я правду в усіх ситуаціях?",
        "Як моя чесність впливає на відносини?",
        "Що заважає мені бути відвертим?"
      ],
      practicalSteps: [
        "Будьте чесними у спілкуванні",
        "Тримайте обіцянки",
        "Визнавайте свої помилки"
      ]
    },
    {
      number: 3,
      title: "Не кради",
      description: "Повага / Неповага відносин",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/3",
      reflections: [
        "Чи поважаю я чужу власність?",
        "Як я можу бути більш щедрим?",
        "Що означає справжня чесність для мене?"
      ],
      practicalSteps: [
        "Поважайте чужу власність",
        "Будьте щедрими з часом та увагою",
        "Платіть справедливу ціну за послуги"
      ]
    },
    {
      number: 4,
      title: "Поважай інших",
      description: "Правдива мова / Брехня",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/4",
      reflections: [
        "Як я ставлюся до інших людей?",
        "Чи проявляю я терпимість до відмінностей?",
        "Що означає справжня повага?"
      ],
      practicalSteps: [
        "Слухайте інших з увагою",
        "Цінуйте різноманітність думок",
        "Допомагайте тим, хто потребує"
      ]
    },
    {
      number: 5,
      title: "Будь вдячним",
      description: "З'єднувальна / Роз'єднувальна мова",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/5",
      reflections: [
        "За що я сьогодні вдячний?",
        "Як вдячність змінює моє сприйняття?",
        "Кому я можу висловити подяку?"
      ],
      practicalSteps: [
        "Щодня записуйте три речі, за які ви вдячні",
        "Дякуйте людям за їхню допомогу",
        "Цінуйте прості радості життя"
      ]
    },
    {
      number: 6,
      title: "Дбай про природу",
      description: "М'яка мова / Груба мова",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/6",
      reflections: [
        "Як мої дії впливають на природу?",
        "Що я можу зробити для довкілля?",
        "Як жити в гармонії з природою?"
      ],
      practicalSteps: [
        "Зменшуйте використання пластику",
        "Економте воду та енергію",
        "Підтримуйте екологічні ініціативи"
      ]
    },
    {
      number: 7,
      title: "Заздрість",
      description: "Значима мова / Пусті розмови",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/7",
      reflections: [
        "Чи відчуваю я заздрість до інших?",
        "Як перетворити заздрість на натхнення?",
        "Що приносить мені справжню радість?"
      ],
      practicalSteps: [
        "Радійте успіхам інших",
        "Фокусуйтеся на власних досягненнях",
        "Практикуйте співчуття"
      ]
    },
    {
      number: 8,
      title: "Допомагай іншим",
      description: "Радість успіхам інших / Заздрість",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/8",
      reflections: [
        "Кому я можу допомогти сьогодні?",
        "Як моя допомога впливає на інших?",
        "Що дає мені радість від служіння?"
      ],
      practicalSteps: [
        "Пропонуйте допомогу без прохання",
        "Волонтерьте у благодійних організаціях",
        "Підтримуйте тих, хто у скруті"
      ]
    },
    {
      number: 9,
      title: "Розвивайся",
      description: "Співчуття / Недоброзичливість",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/9",
      reflections: [
        "Як я можу стати кращою версією себе?",
        "Чому я навчився сьогодні?",
        "Які навички хочу розвивати?"
      ],
      practicalSteps: [
        "Читайте розвивальні книги",
        "Вивчайте нові навички",
        "Рефлексуйте над своїм досвідом"
      ]
    },
    {
      number: 10,
      title: "Живи з любов'ю",
      description: "Правильний / Неправильний світогляд",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/10",
      reflections: [
        "Як я можу проявити більше любові?",
        "Що означає любов до себе?",
        "Як любов змінює світ навколо мене?"
      ],
      practicalSteps: [
        "Проявляйте доброту до себе",
        "Виражайте любов близьким людям",
        "Поширюйте позитивність"
      ]
    }
  ];

  for (const principleData of principlesData) {
    await storage.createOrUpdatePrinciple(principleData);
  }
}
