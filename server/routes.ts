import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import {
  authenticateToken,
  optionalAuth,
  handleTelegramAuth,
  type AuthRequest,
  generateToken,
} from "./auth.js";
import { telegramService } from "./services/telegramService.js";
import { reminderService } from "./services/reminderService.js";
import { insertJournalEntrySchema } from "@shared/schema.js";
import { createSession, checkSession, deleteSession } from "./auth-sessions.js";
import aiRoutes from "./routes/ai.js";
import "./telegram-bot.js"; // Import to start the bot
import webhookRoutes from "./routes/webhooks.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize principles data
  await initializePrinciples();

  // Add request logging for debugging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // Register AI routes with proper prefix
  app.use("/api/ai", aiRoutes);
  // NEW: Webhook routes (важно - БЕЗ аутентификации!)
  app.use("/api/webhooks", webhookRoutes);
  // Auth routes - Session-based Telegram authentication
  app.post("/api/auth/telegram/start-session", (req, res) => {
    try {
      const sessionId = createSession();
      res.json({ sessionId });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/auth/check-session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = checkSession(sessionId);

      if (!session || !session.authorized) {
        return res.json({ authorized: false });
      }

      // Find or create user in database
      if (!session.userData) {
        return res.status(400).json({ error: "Session userData missing" });
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
          notificationType: "daily",
          language: "uk",
          timezoneOffset: 0,
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
          telegramId: user.telegramId,
        },
        isNewUser,
      });
    } catch (error) {
      console.error("Error checking session:", error);
      res.status(500).json({ error: "Failed to check session" });
    }
  });

  // Keep old callback for compatibility
  app.post("/api/auth/telegram/callback", async (req, res) => {
    try {
      const telegramData = req.body;

      if (!telegramData || !telegramData.id) {
        return res.status(400).json({ message: "Invalid Telegram data" });
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
        isNewUser,
      });
    } catch (error) {
      console.error("Telegram auth error:", error);
      res
        .status(400)
        .json({
          message:
            error instanceof Error ? error.message : "Authentication failed",
        });
    }
  });

  // User routes
  app.get("/api/user/me", authenticateToken, async (req: AuthRequest, res) => {
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
          principleProgress: {},
        },
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // New endpoint for practice state
  app.get(
    "/api/user/practice-state",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;
        const currentPrinciple = user.currentPrinciple || 1;
        const nextPrinciple =
          currentPrinciple === 10 ? 1 : currentPrinciple + 1;
        const history = await storage.getUserPrincipleHistory(user.id, 5);

        res.json({
          currentPrinciple,
          practiceMode: user.practiceMode || "sequential",
          nextPrinciple,
          history,
        });
      } catch (error) {
        console.error("Error fetching practice state:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
  );

  // Get today's plan for dashboard
  app.get(
    "/api/dashboard/today-plan",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;
        const today = new Date().toISOString().split("T")[0];

        // Get user's reminder schedules for today
        const userSchedules = await storage.getUserReminderSchedules(user.id);

        // Calculate which principles are scheduled for today
        const todaysPrinciples = [];
        let currentPrinciple = user.currentPrinciple || 1;

        // Count principle reminders in schedule
        const principleReminders = userSchedules.filter(
          (s) => s.type === "principle" && s.enabled,
        );

        for (let i = 0; i < principleReminders.length; i++) {
          const principleNumber = ((currentPrinciple - 1 + i) % 10) + 1;
          const principle = await storage.getPrincipleByNumber(principleNumber);

          if (principle) {
            // Check if user has journal entries for this principle today
            const todaysEntries = await storage.getUserJournalEntries(
              user.id,
              50,
              0,
            );
            const hasEntryToday = todaysEntries.some(
              (entry) =>
                entry.principleId === principle.id &&
                entry.createdAt.toISOString().split("T")[0] === today,
            );

            todaysPrinciples.push({
              ...principle,
              completed: hasEntryToday,
              scheduledTime: principleReminders[i]?.time || "12:00",
            });
          }
        }

        const completed = todaysPrinciples.filter((p) => p.completed).length;
        const total = todaysPrinciples.length;

        res.json({
          principles: todaysPrinciples,
          progress: {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          },
          date: today,
        });
      } catch (error) {
        console.error("Error fetching today's plan:", error);
        res.status(500).json({ error: "Failed to fetch today's plan" });
      }
    },
  );

  app.patch(
    "/api/user/settings",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;
        const { notificationType, customTimes, language, timezoneOffset } =
          req.body;

        const updatedUser = await storage.updateUser(user.id, {
          notificationType,
          customTimes,
          language,
          timezoneOffset,
        });

        res.json({
          message: "Settings updated successfully",
          user: updatedUser,
        });
      } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/user/next-principle",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;
        const nextPrinciple = (user.currentPrinciple % 10) + 1;

        const updatedUser = await storage.updateUser(user.id, {
          currentPrinciple: nextPrinciple,
        });

        res.json({
          message: "Principle updated successfully",
          currentPrinciple: nextPrinciple,
        });
      } catch (error) {
        console.error("Error updating principle:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Principles routes
  app.get("/api/principles", async (req, res) => {
    try {
      const principles = await storage.getAllPrinciples();
      res.json(principles);
    } catch (error) {
      console.error("Error fetching principles:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/principles/:number", async (req, res) => {
    try {
      const number = parseInt(req.params.number);
      if (isNaN(number) || number < 1 || number > 10) {
        return res.status(400).json({ message: "Invalid principle number" });
      }

      const principle = await storage.getPrincipleByNumber(number);
      if (!principle) {
        return res.status(404).json({ message: "Principle not found" });
      }

      res.json(principle);
    } catch (error) {
      console.error("Error fetching principle:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Journal routes
  app.get(
    "/api/journal/entries",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = parseInt(req.query.offset as string) || 0;

        const entries = await storage.getUserJournalEntries(
          user.id,
          limit,
          offset,
        );
        res.json(entries);
      } catch (error) {
        console.error("Error fetching journal entries:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/journal/entries",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;

        // Use the principleId from request body if provided, otherwise use current principle
        const principleId = req.body.principleId || user.currentPrinciple;

        const validatedData = insertJournalEntrySchema.parse({
          ...req.body,
          userId: user.id,
          principleId: principleId,
        });

        const entry = await storage.createJournalEntry(validatedData);

        // Try to update user stats, but don't fail the request if it errors
        try {
          await storage.updateUserStats(user.id);
        } catch (statsError) {
          console.error(
            "Error updating user stats (non-critical):",
            statsError,
          );
        }

        res.status(201).json(entry);
      } catch (error) {
        console.error("Error creating journal entry:", error);
        console.error("Request body:", req.body);
        console.error("Validation error details:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.get(
    "/api/journal/entries/:id",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;
        const entryId = parseInt(req.params.id);

        const entry = await storage.getJournalEntry(entryId);
        if (!entry || entry.userId !== user.id) {
          return res.status(404).json({ message: "Journal entry not found" });
        }

        res.json(entry);
      } catch (error) {
        console.error("Error fetching journal entry:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.patch(
    "/api/journal/entries/:id",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;
        const entryId = parseInt(req.params.id);

        const entry = await storage.getJournalEntry(entryId);
        if (!entry || entry.userId !== user.id) {
          return res.status(404).json({ message: "Journal entry not found" });
        }

        const { content, mood, energyLevel } = req.body;
        const updatedEntry = await storage.updateJournalEntry(entryId, {
          content,
          mood,
          energyLevel,
        });

        res.json(updatedEntry);
      } catch (error) {
        console.error("Error updating journal entry:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Telegram webhook
  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      await telegramService.processBotUpdate(req.body);
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Error processing Telegram webhook:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get bot info
  app.get("/api/bot/info", async (req, res) => {
    try {
      // Get bot info from Telegram API
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return res.status(500).json({ message: "Bot token not configured" });
      }

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`,
      );
      const data = await response.json();

      if (data.ok) {
        res.json({
          username: data.result.username,
          name: data.result.first_name,
        });
      } else {
        // Fallback
        res.json({
          username: "karmics_diary_bot",
          name: "Кармічний Щоденник",
        });
      }
    } catch (error) {
      console.error("Error getting bot info:", error);
      res.json({
        username: "karmics_diary_bot",
        name: "Кармічний Щоденник",
      });
    }
  });

  // Settings endpoints
  app.get(
    "/api/user/reminder-settings",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const schedule = await storage.getUserReminderSchedules(userId);

        res.json({
          remindersEnabled: user.remindersEnabled,
          reminderMode: user.reminderMode,
          dailyPrinciplesCount: user.dailyPrinciplesCount,
          schedule: schedule.map((s) => ({
            id: s.id,
            time: s.time,
            type: s.type,
            enabled: s.enabled,
          })),
        });
      } catch (error) {
        console.error("Error fetching reminder settings:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.put(
    "/api/user/settings",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;
        const {
          remindersEnabled,
          morningReminderTime,
          eveningReminderTime,
          timezone,
        } = req.body;

        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (
          !timeRegex.test(morningReminderTime) ||
          !timeRegex.test(eveningReminderTime)
        ) {
          return res.status(400).json({ error: "Invalid time format" });
        }

        // Update user settings
        const updatedUser = await storage.updateUser(user.id, {
          remindersEnabled,
          morningReminderTime,
          eveningReminderTime,
          timezone: timezone || "Europe/Kiev",
        });

        res.json(updatedUser);
      } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ error: "Failed to update settings" });
      }
    },
  );

  // Test reminder endpoint
  app.post(
    "/api/reminders/test",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;
        const success = await reminderService.sendTestReminder(user.id);
        res.json({
          success,
          message: success
            ? "Test reminder sent"
            : "Failed to send test reminder",
        });
      } catch (error) {
        console.error("Error sending test reminder:", error);
        res.status(500).json({ message: "Failed to send test reminder" });
      }
    },
  );

  // Get reminder modes
  app.get("/api/reminders/modes", async (req, res) => {
    try {
      const { reminderModes } = await import("./config/reminderModes.js");
      res.json(reminderModes);
    } catch (error) {
      console.error("Error getting reminder modes:", error);
      res.status(500).json({ message: "Failed to get reminder modes" });
    }
  });

  // Setup user reminders
  app.post(
    "/api/user/setup-reminders",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;
        const { reminderMode, dailyPrinciplesCount, customSchedule } = req.body;

        // Validate reminder mode
        const validModes = ["intensive", "balanced", "light", "custom"];
        if (!validModes.includes(reminderMode)) {
          return res.status(400).json({ error: "Invalid reminder mode" });
        }

        // Validate principles count
        if (dailyPrinciplesCount < 2 || dailyPrinciplesCount > 6) {
          return res
            .status(400)
            .json({ error: "Daily principles count must be between 2 and 6" });
        }

        // Setup reminders in transaction
        const result = await storage.setupUserReminders(user.id, {
          reminderMode,
          dailyPrinciplesCount,
          customSchedule:
            reminderMode === "custom" ? customSchedule : undefined,
        });

        res.json(result);
      } catch (error) {
        console.error("Error setting up reminders:", error);
        res.status(500).json({ error: "Failed to setup reminders" });
      }
    },
  );

  // Trigger manual reminder check (for testing)
  // AI Insights endpoints
  app.get(
    "/api/insights/daily/:principleId",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;
        const principleId = parseInt(req.params.principleId);
        const regenerate = req.query.regenerate === "true";

        const { getDailyInsight } = await import("./services/aiService");
        const insight = await getDailyInsight(principleId, user.id, regenerate);

        res.json({ insight });
      } catch (error) {
        console.error("Error fetching daily insight:", error);
        res.status(500).json({
          error: "Failed to generate insight",
          insight:
            "Сьогодні спробуй застосувати цей принцип у повсякденних справах.",
        });
      }
    },
  );

  // Complete onboarding endpoint
  app.patch(
    "/api/user/onboarding/complete",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const user = req.user!;

        const updatedUser = await storage.updateUser(user.id, {
          hasCompletedOnboarding: true,
        });

        res.json(updatedUser);
      } catch (error) {
        console.error("Error completing onboarding:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  app.post(
    "/api/reminders/trigger",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        await reminderService.triggerReminderCheck();
        res.json({ success: true, message: "Reminder check triggered" });
      } catch (error) {
        console.error("Error triggering reminder check:", error);
        res.status(500).json({ message: "Failed to trigger reminder check" });
      }
    },
  );

  // Test reminder endpoint (for development)
  app.post("/api/test/reminder/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const success = await reminderService.sendTestReminder(userId);

      res.json({
        success,
        message: success
          ? "Test reminder sent"
          : "Failed to send test reminder",
      });
    } catch (error) {
      console.error("Error sending test reminder:", error);
      res.status(500).json({ message: "Internal server error" });
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
        "Чи можу я замінити шкідливі звички на корисні?",
      ],
      practicalSteps: [
        "Обирайте екологічні продукти",
        "Проявляйте доброту до тварин",
        "Підтримуйте чистоту довкілля",
      ],
    },
    {
      number: 2,
      title: "Говори правду",
      description:
        "Щедрість / Крадіжки. Збереження чужого майна / Пошкодження чужого майна",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/2",
      reflections: [
        "Чи говорю я правду в усіх ситуаціях?",
        "Як моя чесність впливає на відносини?",
        "Що заважає мені бути відвертим?",
      ],
      practicalSteps: [
        "Будьте чесними у спілкуванні",
        "Тримайте обіцянки",
        "Визнавайте свої помилки",
      ],
    },
    {
      number: 3,
      title: "Не кради",
      description: "Повага / Неповага відносин",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/3",
      reflections: [
        "Чи поважаю я чужу власність?",
        "Як я можу бути більш щедрим?",
        "Що означає справжня чесність для мене?",
      ],
      practicalSteps: [
        "Поважайте чужу власність",
        "Будьте щедрими з часом та увагою",
        "Платіть справедливу ціну за послуги",
      ],
    },
    {
      number: 4,
      title: "Поважай інших",
      description: "Правдива мова / Брехня",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/4",
      reflections: [
        "Як я ставлюся до інших людей?",
        "Чи проявляю я терпимість до відмінностей?",
        "Що означає справжня повага?",
      ],
      practicalSteps: [
        "Слухайте інших з увагою",
        "Цінуйте різноманітність думок",
        "Допомагайте тим, хто потребує",
      ],
    },
    {
      number: 5,
      title: "Будь вдячним",
      description: "З'єднувальна / Роз'єднувальна мова",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/5",
      reflections: [
        "За що я сьогодні вдячний?",
        "Як вдячність змінює моє сприйняття?",
        "Кому я можу висловити подяку?",
      ],
      practicalSteps: [
        "Щодня записуйте три речі, за які ви вдячні",
        "Дякуйте людям за їхню допомогу",
        "Цінуйте прості радості життя",
      ],
    },
    {
      number: 6,
      title: "Дбай про природу",
      description: "М'яка мова / Груба мова",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/6",
      reflections: [
        "Як мої дії впливають на природу?",
        "Що я можу зробити для довкілля?",
        "Як жити в гармонії з природою?",
      ],
      practicalSteps: [
        "Зменшуйте використання пластику",
        "Економте воду та енергію",
        "Підтримуйте екологічні ініціативи",
      ],
    },
    {
      number: 7,
      title: "Заздрість",
      description: "Значима мова / Пусті розмови",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/7",
      reflections: [
        "Чи відчуваю я заздрість до інших?",
        "Як перетворити заздрість на натхнення?",
        "Що приносить мені справжню радість?",
      ],
      practicalSteps: [
        "Радійте успіхам інших",
        "Фокусуйтеся на власних досягненнях",
        "Практикуйте співчуття",
      ],
    },
    {
      number: 8,
      title: "Допомагай іншим",
      description: "Радість успіхам інших / Заздрість",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/8",
      reflections: [
        "Кому я можу допомогти сьогодні?",
        "Як моя допомога впливає на інших?",
        "Що дає мені радість від служіння?",
      ],
      practicalSteps: [
        "Пропонуйте допомогу без прохання",
        "Волонтерьте у благодійних організаціях",
        "Підтримуйте тих, хто у скруті",
      ],
    },
    {
      number: 9,
      title: "Розвивайся",
      description: "Співчуття / Недоброзичливість",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/9",
      reflections: [
        "Як я можу стати кращою версією себе?",
        "Чому я навчився сьогодні?",
        "Які навички хочу розвивати?",
      ],
      practicalSteps: [
        "Читайте розвивальні книги",
        "Вивчайте нові навички",
        "Рефлексуйте над своїм досвідом",
      ],
    },
    {
      number: 10,
      title: "Живи з любов'ю",
      description: "Правильний / Неправильний світогляд",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/10",
      reflections: [
        "Як я можу проявити більше любові?",
        "Що означає любов до себе?",
        "Як любов змінює світ навколо мене?",
      ],
      practicalSteps: [
        "Проявляйте доброту до себе",
        "Виражайте любов близьким людям",
        "Поширюйте позитивність",
      ],
    },
    {
      number: 5,
      title: "Контролюй слова",
      description: "Добра мова / Груба мова",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/5",
      reflections: [
        "Чи приносять мої слова користь іншим?",
        "Як я можу говорити більш обдумано?",
        "Що відчувають люди після розмови зі мною?",
      ],
      practicalSteps: [
        "Говоріть добрі слова підтримки",
        "Уникайте грубощів та образ",
        "Практикуйте активне слухання",
      ],
    },
    {
      number: 6,
      title: "Контролюй думки",
      description: "Доброзичливість / Злоба",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/6",
      reflections: [
        "Які думки переважають у моєму розумі?",
        "Як я можу культивувати позитивне мислення?",
        "Що допомагає мені зберігати внутрішній спокій?",
      ],
      practicalSteps: [
        "Практикуйте медитацію та усвідомленість",
        "Замінюйте негативні думки на позитивні",
        "Розвивайте вдячність і доброзичливість",
      ],
    },
    {
      number: 7,
      title: "Будь мудрим",
      description: "Мудрість / Невігластво",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/7",
      reflections: [
        "Як я можу розвивати свою мудрість?",
        "Чи приймаю я обдумані рішення?",
        "Що означає справжня мудрість для мене?",
      ],
      practicalSteps: [
        "Постійно навчайтеся та розвивайтеся",
        "Міркуйте перед прийняттям рішень",
        "Вчіться на власних помилках",
      ],
    },
    {
      number: 8,
      title: "Практикуй терпеливість",
      description: "Терпеливість / Гнів",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/8",
      reflections: [
        "Як я реагую у стресових ситуаціях?",
        "Що допомагає мені зберігати спокій?",
        "Чи можу я бути більш терплячим до інших?",
      ],
      practicalSteps: [
        "Практикуйте глибоке дихання",
        "Зробіть паузу перед реакцією",
        "Розвивайте розуміння та співчуття",
      ],
    },
    {
      number: 9,
      title: "Зберігай рівновагу",
      description: "Помірність / Жадібність",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/9",
      reflections: [
        "Чи живу я збалансованим життям?",
        "Що означає помірність у моєму житті?",
        "Як я можу знайти гармонію між роботою та відпочинком?",
      ],
      practicalSteps: [
        "Підтримуйте баланс між роботою та особистим життям",
        "Практикуйте помірність у споживанні",
        "Знайдіть час для відновлення сил",
      ],
    },
    {
      number: 10,
      title: "Будь вдячним",
      description: "Вдячність / Зневага",
      url: "https://vitalinapetrova.com.ua/karma-chelendzh/10",
      reflections: [
        "За що я сьогодні можу бути вдячним?",
        "Як вдячність змінює моє сприйняття життя?",
        "Яким чином я можу виражати вдячність іншим?",
      ],
      practicalSteps: [
        "Ведіть щоденник вдячності",
        "Висловлюйте подяку людям навколо",
        "Цінуйте прості радості життя",
      ],
    },
  ];

  for (const principleData of principlesData) {
    await storage.createOrUpdatePrinciple(principleData);
  }
}
