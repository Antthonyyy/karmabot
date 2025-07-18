import { checkSubscription, checkFeatureLimit } from "./middleware/checkSubscription";
import type { Express, Response } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import crypto from "crypto";
import { storage } from "./storage.js";
import {
  authenticateToken,
  optionalAuth,
  handleGoogleAuth,
  type AuthRequest,
  generateToken,
} from "./auth.js";
import { telegramService } from "./services/telegramService.js";
import { reminderService } from "./services/reminderService.js";
import { insertJournalEntrySchema, principles } from "@shared/schema.js";
import { createSession, checkSession, deleteSession } from "./auth-sessions.js";
import { db } from "./db.js";
import { sql } from "drizzle-orm";
import aiRoutes from "./routes/ai.js";
import audioRoutes from "./routes/audio.js";
import bot from "./telegram-bot.js"; // Import bot instance
import webhookRoutes from "./routes/webhooks.js";
import sitemapRoutes from "./routes/sitemap.js";
import { supabase } from "./supabase.js";
import { requireSubscription } from "./middleware/subscription.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add Telegram webhook handler BEFORE other routes - ИСПРАВЛЕНА БЕЗОПАСНОСТЬ
  app.post('/api/telegram/webhook', express.json(), (req, res) => {
    console.log('🔗 Webhook received');
    
    // ИСПРАВЛЕНИЕ: Делаем webhook секрет опциональным для деплоя
    const signature = req.headers['x-telegram-bot-api-secret-token'] as string;
    const expectedSignature = process.env.WEBHOOK_SECRET;
    
    if (expectedSignature && signature !== expectedSignature) {
      console.log('❌ Unauthorized webhook access - invalid signature');
      return res.status(401).send('Unauthorized');
    }
    
    if (bot) {
      console.log('✅ Processing Telegram update via webhook');
      bot.processUpdate(req.body);
    } else {
      console.log('❌ Bot not available');
    }
    res.sendStatus(200);
  });

  // Initialize principles data
  await initializePrinciples();

  // Add request logging for debugging
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Google OAuth callback route
  app.get("/auth/google/callback", async (req, res) => {
    console.log("[GOOGLE CALLBACK] query:", req.query);
    
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({ error: "Authorization code is required" });
      }

      // Exchange code for tokens (you'll need to implement this)
      // const tokens = await googleService.exchangeCodeForTokens(code);
      // const authResult = await handleGoogleAuth(tokens.id_token);
      
      // For now, redirect to login page if no implementation
      return res.redirect("/login?error=callback_not_implemented");
      
    } catch (error) {
      console.error("[GOOGLE CALLBACK ERROR]", error);
      return res.redirect("/login?error=auth_failed");
    }
  });

  // Google OAuth authentication endpoint
  app.post("/api/auth/google", async (req, res) => {
    console.log("[GOOGLE AUTH] body:", req.body);
    console.log('🔑 Google OAuth endpoint hit:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ error: "Google ID token is required" });
      }

      console.log('🎫 Received idToken:', {
        length: idToken.length,
        preview: idToken.substring(0, 100) + '...',
        type: typeof idToken
      });

      const authResult = await handleGoogleAuth(idToken);
      
      // Return JSON response instead of redirect
      res.json({
        token: authResult.token,
        user: authResult.user,
        isNewUser: authResult.isNewUser,
        needsSubscription: authResult.needsSubscription
      });
    } catch (error) {
      console.error("[GOOGLE AUTH ERROR]", error);
      console.error("Google auth error:", error);
      return res.status(500).json({ 
        message: "auth failed", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Subscription routes
  app.post('/api/subscription/select', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { plan } = req.body;
      const userId = req.user.id;
      
      console.log('📋 Subscription selection:', { userId, plan });
      
      // Валидация плана
      if (!['light', 'plus', 'pro'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan selected' });
      }
      
      // Обновляем подписку пользователя
      const updatedUser = await storage.updateUser(userId, {
        subscription: plan,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 дней
      });
      
      console.log('✅ Subscription updated:', { userId, plan });
      
      res.json({ 
        success: true, 
        user: updatedUser 
      });
    } catch (error) {
      console.error('❌ Subscription selection error:', error);
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  });

  // Health check endpoint for deployment
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Register AI routes with proper prefix
  app.use("/api/ai", aiRoutes);
  // Register audio routes
  app.use("/api/audio", audioRoutes);
  // NEW: Webhook routes (важно - БЕЗ аутентификации!)
  app.use("/api/webhooks", webhookRoutes);
  // SEO routes (sitemap, robots.txt, manifest)
  app.use("/", sitemapRoutes);

  // Error reporting endpoint
  app.post("/api/errors", express.json(), (req, res) => {
    try {
      const { error, stack, componentStack, url, userAgent, timestamp, errorId } = req.body;
      
      console.error("🚨 Client Error Report:", {
        errorId,
        error,
        url,
        userAgent,
        timestamp
      });
      
      // В production можно отправлять в Sentry или другую систему мониторинга
      if (stack) {
        console.error("Stack trace:", stack);
      }
      if (componentStack) {
        console.error("Component stack:", componentStack);
      }
      
      res.status(200).json({ 
        success: true, 
        errorId,
        message: "Error report received" 
      });
    } catch (err) {
      console.error("Error processing error report:", err);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process error report" 
      });
    }
  });



  

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
      console.log(`🔍 Checking session: ${sessionId}`);
      const session = checkSession(sessionId);

      if (!session) {
        console.log(`❌ Session not found: ${sessionId}`);
        return res.json({ authorized: false });
      }

      if (!session.authorized) {
        console.log(`⏳ Session not yet authorized: ${sessionId}`);
        return res.json({ authorized: false });
      }

      console.log(`✅ Session authorized: ${sessionId}`);

      // Find or create user in database
      if (!session.userData) {
        console.error(`❌ Session userData missing for: ${sessionId}`);
        return res.status(400).json({ error: "Session userData missing" });
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
        email: user.email,
        currentPrinciple: user.currentPrinciple,
        notificationType: user.notificationType,
        customTimes: user.customTimes,
        language: user.language,
        subscription: user.subscription || 'none',
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        profilePicture: user.profilePicture,
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

  // Profile update endpoint
  app.patch("/api/user/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      
      // ИСПРАВЛЕНИЕ Mass Assignment: Явно указываем разрешенные поля
      const allowedFields = ['firstName', 'lastName', 'username'];
      const updateData: any = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          // Дополнительная валидация
          if (typeof req.body[field] === 'string' && req.body[field].length <= 100) {
            updateData[field] = req.body[field].trim();
          }
        }
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updatedUser = await storage.updateUser(user.id, updateData);

      res.json({
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  // Get user profile endpoint
app.get('/api/user/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Получаем дополнительные данные
    const stats = await storage.getUserStats(userId);
    
    res.json({ 
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        subscription: user.subscription || 'free',
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        currentPrinciple: user.currentPrinciple,
        notificationType: user.notificationType,
        language: user.language,
        telegramConnected: !!user.telegramChatId,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        createdAt: user.createdAt,
        stats: stats || null
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

  // Setup multer for avatar upload
  const upload = multer({
    limits: { fileSize: 5_000_000 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Avatar upload endpoint (temporarily disabled - avatarUrl column not in database)
  /*
  app.post("/api/user/avatar", authenticateToken, upload.single('avatar'), async (req: AuthRequest, res) => {
    try {
      // Return success without updating database since avatarUrl column doesn't exist
      res.json({ message: 'Avatar upload temporarily disabled' });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
  */

  // Get current user endpoint
  // REMOVED DUPLICATE: app.get("/api/user/me", authenticateToken, async (req: AuthRequest, res) => {
  // This was causing conflicts with the proper endpoint above
  
  // User stats endpoint
  app.get("/api/user/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const stats = await storage.getUserStats(user.id);

      if (!stats) {
        // Initialize stats if they don't exist
        const newStats = await storage.initializeUserStats(user.id);
        return res.json({
          streakDays: newStats.streakDays || 0,
          totalEntries: newStats.totalEntries || 0,
          currentStreak: newStats.streakDays || 0,
          bestStreak: newStats.bestStreak || 0,
          longestStreak: newStats.bestStreak || 0,
          currentCycle: newStats.currentCycle || 1,
          totalDaysWithEntries: newStats.totalEntries || 0,
          principleProgress: newStats.principleProgress || {},
          principleCompletions: newStats.principleCompletions || [],
          averageMood: newStats.averageMood || null,
          averageEnergy: newStats.averageEnergy || null,
          lastEntryDate: newStats.lastEntryDate || null,
          weeklyGoal: 7,
          monthlyGoal: 30,
        });
      }

      res.json({
        streakDays: stats.streakDays || 0,
        totalEntries: stats.totalEntries || 0,
        currentStreak: stats.streakDays || 0,
        bestStreak: stats.bestStreak || 0,
        longestStreak: stats.bestStreak || 0,
        currentCycle: stats.currentCycle || 1,
        totalDaysWithEntries: stats.totalEntries || 0,
        principleProgress: stats.principleProgress || {},
        principleCompletions: stats.principleCompletions || [],
        averageMood: stats.averageMood || null,
        averageEnergy: stats.averageEnergy || null,
        lastEntryDate: stats.lastEntryDate || null,
        weeklyGoal: 7,
        monthlyGoal: 30,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
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

  // Quick entry endpoint (used by ModalEntryForm)
  app.post("/api/entries", authenticateToken, async (req: AuthRequest, res) => {
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
        console.error("Error updating user stats (non-critical):", statsError);
      }

      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating entry:", error);
      console.error("Request body:", req.body);
      res.status(400).json({ 
        message: "Failed to create entry", 
        error: error.message || "Invalid data provided"
      });
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
        const { reminderMode, customSchedule, dailyPrinciplesCount } = req.body;

        // Validate reminder mode
        const validModes = ["intensive", "balanced", "light", "custom"];
        if (!validModes.includes(reminderMode)) {
          return res.status(400).json({ error: "Invalid reminder mode" });
        }

        // Get default principles count based on mode if not provided
        let principlesCount = dailyPrinciplesCount;
        if (!principlesCount) {
          const defaultCounts = {
            intensive: 4,
            balanced: 3,
            light: 2,
            custom: 2
          };
          principlesCount = defaultCounts[reminderMode as keyof typeof defaultCounts] || 2;
        }

        // Setup reminders in transaction
        const result = await storage.setupUserReminders(user.id, {
          reminderMode,
          dailyPrinciplesCount: principlesCount,
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

  // Subscription endpoints
  app.get("/api/subscriptions/plans", (req, res) => {
    const plans = [
      {
        id: 'light',
        name: 'Лайт',
        monthly: 5,
        yearly: 50,
        currency: 'EUR',
        features: [
          'Щоденник карми',
          'Базова аналітика',
          'Експорт даних',
          'Нагадування в Telegram',
          'Підтримка спільноти'
        ]
      },
      {
        id: 'plus',
        name: 'Плюс',
        monthly: 10,
        yearly: 100,
        currency: 'EUR',
        features: [
          'Все з тарифу Лайт',
          '5 AI-порад на місяць',
          'Розширена аналітика',
          'Персональні рекомендації',
          'Досягнення та геймификація',
          'Пріоритетна підтримка'
        ]
      },
      {
        id: 'pro',
        name: 'Про',
        monthly: 20,
        yearly: 200,
        currency: 'EUR',
        features: [
          'Все з тарифу Плюс',
          'Необмежені AI-поради',
          'AI-чат консультант',
          'Розширені інсайти',
          'Персональний коучинг',
          'VIP підтримка'
        ]
      }
    ];
    
    res.json(plans);
  });

  app.get("/api/subscriptions/current", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      const subscriptions = await storage.getUserSubscriptions(user.id);
      
      // Return the most recent active subscription or none
      const activeSubscription = subscriptions.find(sub => sub.status === 'active');
      
      if (activeSubscription) {
        res.json({
          plan: activeSubscription.plan,
          startDate: activeSubscription.startDate,
          endDate: activeSubscription.endDate,
          expiresAt: activeSubscription.expiresAt,
          status: activeSubscription.status
        });
      } else {
        res.json({
          plan: 'none',
          startDate: null,
          endDate: null,
          expiresAt: null,
          status: null
        });
      }
    } catch (error) {
      console.error("Error fetching current subscription:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/subscriptions/subscribe", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { planId, billingPeriod } = req.body;
      const user = req.user;
      
      // Calculate expiration date for paid subscription
      const expiresAt = billingPeriod === 'yearly' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Create subscription record
      const subscription = await storage.createSubscription({
        userId: user.id,
        plan: planId,
        billingPeriod,
        status: 'pending',
        startDate: new Date(),
        endDate: billingPeriod === 'yearly' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        expiresAt,
        amount: billingPeriod === 'yearly' 
          ? (planId === 'light' ? '50.00' : planId === 'plus' ? '100.00' : '200.00')
          : (planId === 'light' ? '5.00' : planId === 'plus' ? '10.00' : '20.00')
      });

      // Create WayForPay payment URL (mock for now)
      const paymentUrl = `https://secure.wayforpay.com/pay?planId=${planId}&billingPeriod=${billingPeriod}&subscriptionId=${subscription.id}`;
      
      res.json({
        subscriptionId: subscription.id,
        paymentUrl
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/subscriptions/cancel", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = req.user;
      const subscriptions = await storage.getUserSubscriptions(user.id);
      
      // Find active subscription and cancel it
      const activeSubscription = subscriptions.find(sub => sub.status === 'active');
      
      if (activeSubscription) {
        await storage.updateSubscriptionStatus(activeSubscription.id, 'cancelled');
        res.json({ message: "Subscription cancelled successfully" });
      } else {
        res.status(404).json({ message: "No active subscription found" });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Test subscription middleware routes
  app.get("/api/test/trial", authenticateToken, requireSubscription('trial'), async (req: AuthRequest, res) => {
    res.json({ message: "Trial access granted!", user: req.user.firstName });
  });

  app.get("/api/test/light", authenticateToken, requireSubscription('light'), async (req: AuthRequest, res) => {
    res.json({ message: "Light plan access granted!", user: req.user.firstName });
  });

  app.get("/api/test/pro", authenticateToken, requireSubscription('pro'), async (req: AuthRequest, res) => {
    res.json({ message: "Pro plan access granted!", user: req.user.firstName });
  });

  // Push notification routes
  app.post("/api/push/subscribe", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { endpoint, keys } = req.body;
      const user = req.user;
      
      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return res.status(400).json({ 
          message: "Invalid subscription data" 
        });
      }

      const subscription = await storage.createPushSubscription({
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: req.headers['user-agent'] || null
      });

      res.json({ 
        message: "Push subscription created successfully",
        subscriptionId: subscription.id
      });
    } catch (error) {
      console.error("Error creating push subscription:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/push/unsubscribe", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { endpoint } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ 
          message: "Endpoint is required" 
        });
      }

      await storage.deletePushSubscription(endpoint);
      
      res.json({ 
        message: "Push subscription removed successfully" 
      });
    } catch (error) {
      console.error("Error removing push subscription:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Get user's push subscriptions
  app.get("/api/push/subscriptions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log("📱 Starting push subscriptions request");
      const user = req.user;
      console.log("👤 User ID:", user?.id);
      
      if (!user) {
        console.log("❌ No user found in request");
        return res.status(401).json({ message: "User not authenticated" });
      }

      console.log("🔍 Fetching push subscriptions for user:", user.id);
      const subscriptions = await storage.getUserPushSubscriptions(user.id);
      console.log("✅ Push subscriptions fetched:", subscriptions.length);
      
      const response = { 
        subscriptions: subscriptions.map(sub => ({
          id: sub.id,
          endpoint: sub.endpoint,
          userAgent: sub.userAgent,
          createdAt: sub.createdAt
        }))
      };
      
      console.log("📤 Sending response:", response);
      res.json(response);
    } catch (error) {
      console.error("❌ Error fetching push subscriptions:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ message: "Internal server error" });
    }
  });
// ===== PROTECTED SUBSCRIPTION ROUTES =====
  
  // AI функции - доступны только для Plus и Pro
  app.post("/api/ai/ask", 
    authenticateToken, 
    checkSubscription("plus"), 
    checkFeatureLimit("ai_requests"),
    async (req: AuthRequest, res) => {
      try {
        const { question, principleId } = req.body;
        
        // Проверяем лимит (если не unlimited)
        if (req.featureLimit !== -1) {
          // Здесь проверка текущего использования
          const currentUsage = await storage.getMonthlyUsage(req.user.id, "ai_requests");
          
          if (currentUsage >= req.featureLimit) {
            return res.status(429).json({
              error: `Ви досягли місячного ліміту (${req.featureLimit} запитів)`,
              code: "LIMIT_REACHED",
              currentUsage,
              limit: req.featureLimit
            });
          }
          
          // Увеличиваем счетчик использования
          await storage.incrementUsage(req.user.id, "ai_requests");
        }
        
        // Логика AI
        const { generateAIResponse } = await import("./services/aiService");
        const response = await generateAIResponse(question, principleId);
        res.json({ response });
        
      } catch (error) {
        console.error("AI error:", error);
        res.status(500).json({ error: "AI service error" });
      }
    }
  );

  // Экспорт данных - доступен для всех платных планов
  app.get("/api/export/journal", 
    authenticateToken, 
    checkSubscription("light"),
    async (req: AuthRequest, res) => {
      try {
        const format = req.query.format as string || "csv";
        const entries = await storage.getUserJournalEntries(req.user.id, 1000, 0);
        
        if (format === "csv") {
          const csv = entries.map(e => 
            `"${e.createdAt.toISOString()}","${e.principle?.title || ''}","${e.content.replace(/"/g, '""')}","${e.mood || ''}","${e.energyLevel || ''}"`
          ).join('\n');
          
          const header = '"Date","Principle","Content","Mood","Energy Level"\n';
          
          res.setHeader("Content-Type", "text/csv");
          res.setHeader("Content-Disposition", 'attachment; filename="karma-journal.csv"');
          res.send(header + csv);
        } else {
          res.json(entries);
        }
        
      } catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ error: "Export failed" });
      }
    }
  );

  // Расширенная аналитика - только Pro
  app.get("/api/analytics/advanced", 
    authenticateToken, 
    checkSubscription("pro"),
    async (req: AuthRequest, res) => {
      try {
        const userId = req.user.id;
        const entries = await storage.getUserJournalEntries(userId, 1000, 0);
        
        // Анализ по принципам
        const principleStats = {};
        entries.forEach(entry => {
          const pId = entry.principleId;
          if (!principleStats[pId]) {
            principleStats[pId] = { count: 0, moods: [], energyLevels: [] };
          }
          principleStats[pId].count++;
          if (entry.mood) principleStats[pId].moods.push(entry.mood);
          if (entry.energyLevel) principleStats[pId].energyLevels.push(entry.energyLevel);
        });
        
        // Тренды по времени
        const monthlyTrends = {};
        entries.forEach(entry => {
          const month = entry.createdAt.toISOString().substring(0, 7);
          monthlyTrends[month] = (monthlyTrends[month] || 0) + 1;
        });
        
        res.json({
          totalEntries: entries.length,
          principleStats,
          monthlyTrends,
          averageEntriesPerDay: entries.length / 30,
          mostActivePrinciple: Object.entries(principleStats)
            .sort((a, b) => b[1].count - a[1].count)[0]
        });
      } catch (error) {
        console.error("Analytics error:", error);
        res.status(500).json({ error: "Analytics service error" });
      }
    }
  );

  // Персональные рекомендации - Plus и выше
  app.get("/api/recommendations/personal", 
    authenticateToken, 
    checkSubscription("plus"),
    async (req: AuthRequest, res) => {
      try {
        const userId = req.user.id;
        const stats = await storage.getUserStats(userId);
        const entries = await storage.getUserJournalEntries(userId, 50, 0);
        
        // Простые рекомендации на основе данных
        const recommendations = [];
        
        if (stats.streakDays < 3) {
          recommendations.push({
            type: "consistency",
            message: "Спробуйте вести щоденник кожен день для кращих результатів",
            priority: "high"
          });
        }
        
        if (entries.length > 0) {
          const lastEntry = entries[0];
          const daysSinceLastEntry = Math.floor(
            (Date.now() - lastEntry.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceLastEntry > 2) {
            recommendations.push({
              type: "reminder",
              message: `Ви не вели щоденник ${daysSinceLastEntry} днів. Час повернутися до практики!`,
              priority: "medium"
            });
          }
        }
        
        recommendations.push({
          type: "tip",
          message: "Додавайте настрій та рівень енергії до записів для кращого самоаналізу",
          priority: "low"
        });
        
        res.json({ recommendations });
      } catch (error) {
        console.error("Recommendations error:", error);
        res.status(500).json({ error: "Failed to generate recommendations" });
      }
    }
  );

  // ===== END PROTECTED SUBSCRIPTION ROUTES =====

  // Usage tracking endpoint
  app.get("/api/usage/:feature",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const { feature } = req.params;
        const userId = req.user.id;
        const usage = await checkFeatureLimit(userId, feature);
        res.json(usage);
      } catch (error) {
        console.error("Error fetching usage:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  // Test endpoint for debugging email processing
  app.post("/api/test/email", async (req, res) => {
    console.log("🧪 Test email endpoint hit");
    console.log("📧 Request body:", req.body);
    console.log("📧 Email from body:", req.body.email);
    console.log("📧 Email details:", {
      email: req.body.email,
      type: typeof req.body.email,
      length: req.body.email ? req.body.email.length : 0,
      hasAt: req.body.email ? req.body.email.includes('@') : false,
      charCodes: req.body.email ? [...req.body.email].map(c => c.charCodeAt(0)) : []
    });
    
    try {
      if (req.body.email) {
        const user = await storage.getUserByEmail(req.body.email);
        console.log("👤 User found:", user ? "Yes" : "No");
        res.json({ success: true, userFound: !!user, email: req.body.email });
      } else {
        res.json({ success: false, error: "No email provided" });
      }
    } catch (error) {
      console.error("❌ Test email error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // User flow state endpoint
  app.get('/api/user/flow-state', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      
      const state = {
        isAuthenticated: true,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        hasActiveSubscription: user.subscription !== 'none',
        nextStep: determineNextStep(user)
      };
      
      res.json(state);
    } catch (error) {
      console.error('❌ Flow state error:', error);
      res.status(500).json({ error: 'Failed to get flow state' });
    }
  });

  function determineNextStep(user: any): string {
    if (!user.hasCompletedOnboarding) return 'onboarding';
    if (user.subscription === 'none') return 'subscription';
    return 'dashboard';
  }

  const httpServer = createServer(app);
  return httpServer;
}

// Initialize principles data
async function initializePrinciples() {
  // Check if principles already exist
  const existingCount = await db.select({ count: sql<number>`count(*)` }).from(principles);
  
  if (existingCount[0].count > 0) {
    console.log("🟢 Principles already seeded – skipping initialization");
    return;
  }

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
