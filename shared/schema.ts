import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, date, decimal, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: varchar("telegram_id").unique(),
  telegramChatId: varchar("telegram_chat_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  username: text("username"),
  currentPrinciple: integer("current_principle").default(1),
  timezoneOffset: integer("timezone_offset").default(0),
  notificationType: varchar("notification_type").default("daily"),
  customTimes: jsonb("custom_times"),
  language: varchar("language").default("uk"),
  isActive: boolean("is_active").default(true),
  reminderMode: text("reminder_mode").default("balanced"), // 'intensive', 'balanced', 'light', 'custom'
  dailyPrinciplesCount: integer("daily_principles_count").default(2),
  timezone: text("timezone").default("Europe/Kiev"),
  remindersEnabled: boolean("reminders_enabled").default(true),
  lastReminderSent: timestamp("last_reminder_sent"),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  subscription: text("subscription").$type<'none' | 'light' | 'plus' | 'pro'>().default('none'),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  preferredLanguage: text("preferred_language").default('uk'),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const principles = pgTable("principles", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  url: text("url"),
  reflections: jsonb("reflections"),
  practicalSteps: jsonb("practical_steps"),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  principleId: integer("principle_id").references(() => principles.id).notNull(),
  content: text("content").notNull(),
  mood: varchar("mood"),
  energyLevel: integer("energy_level"),
  isCompleted: boolean("is_completed").default(false),
  isSkipped: boolean("is_skipped").default(false),
  source: varchar("source", { length: 50 }).default("web"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  telegramId: varchar("telegram_id", { length: 255 }).unique(),
  currentPrincipleContext: integer("current_principle_context"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  streakDays: integer("streak_days").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalEntries: integer("total_entries").default(0),
  currentCycle: integer("current_cycle").default(1),
  lastEntryDate: timestamp("last_entry_date"),
  principleProgress: jsonb("principle_progress"),
  weeklyGoal: integer("weekly_goal").default(7),
  monthlyGoal: integer("monthly_goal").default(30),
  averageMood: real("average_mood"),
  averageEnergy: real("average_energy"),
  totalReflectionTime: integer("total_reflection_time").default(0), // in minutes
  principleCompletions: jsonb("principle_completions"), // track completions per principle
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  entriesCount: integer("entries_count").default(0),
  averageMood: real("average_mood"),
  averageEnergy: real("average_energy"),
  principlesWorked: jsonb("principles_worked"), // array of principle IDs
  reflectionTime: integer("reflection_time").default(0), // minutes spent
  createdAt: timestamp("created_at").defaultNow(),
});

export const weeklyStats = pgTable("weekly_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  weekStart: date("week_start").notNull(),
  weekEnd: date("week_end").notNull(),
  totalEntries: integer("total_entries").default(0),
  averageMood: real("average_mood"),
  averageEnergy: real("average_energy"),
  principlesProgress: jsonb("principles_progress"),
  goalCompletion: real("goal_completion"), // percentage
  createdAt: timestamp("created_at").defaultNow(),
});

export const reminderSchedules = pgTable("reminder_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  time: text("time").notNull(), // Time in HH:MM format
  type: text("type").notNull(), // 'principle' or 'reflection'
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPrinciples = pgTable("user_principles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  principleId: integer("principle_id").notNull().references(() => principles.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  principleOrder: integer("principle_order").default(1), // Order of principle in the day
  reminderTime: text("reminder_time"), // Time when reminder was sent
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const principleHistory = pgTable("principle_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  principleId: integer("principle_id").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  completed: boolean("completed").default(false),
});

export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  principleId: integer("principle_id").notNull(),
  insightText: text("insight_text").notNull(),
  createdDate: date("created_date").defaultNow(),
  interactions: jsonb("interactions").default({}),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  plan: text("plan").$type<'trial' | 'light' | 'plus' | 'pro'>().default('trial').notNull(),
  billingPeriod: text("billing_period").$type<'monthly' | 'yearly'>(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").$type<'active' | 'cancelled' | 'expired' | 'pending'>().default('active').notNull(),
  paymentOrderId: text("payment_order_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: text("currency").default('EUR'),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const aiRequests = pgTable("ai_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").$type<'advisor' | 'chat' | 'insight'>().notNull(),
  tokensUsed: integer("tokens_used").notNull().default(0),
  cost: decimal("cost", { precision: 10, scale: 4 }).notNull().default('0'),
  model: text("model").notNull().default('gpt-4o'),
  prompt: text("prompt"),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiCache = pgTable("ai_cache", {
  id: serial("id").primaryKey(),
  questionHash: text("question_hash").notNull().unique(),
  response: text("response").notNull(),
  language: text("language").default('uk'),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").$type<'first_entry' | '7_days_streak' | '30_days_streak' | '50_entries' | '100_entries' | 'gratitude_master' | 'karma_champion'>().notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  notified: boolean("notified").default(false),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  journalEntries: many(journalEntries),
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
  reminderSchedules: many(reminderSchedules),
  userPrinciples: many(userPrinciples),
  subscriptions: many(subscriptions),
  aiRequests: many(aiRequests),
  achievements: many(achievements),
  pushSubscriptions: many(pushSubscriptions),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
  principle: one(principles, {
    fields: [journalEntries.principleId],
    references: [principles.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const dailyStatsRelations = relations(dailyStats, ({ one }) => ({
  user: one(users, {
    fields: [dailyStats.userId],
    references: [users.id],
  }),
}));

export const weeklyStatsRelations = relations(weeklyStats, ({ one }) => ({
  user: one(users, {
    fields: [weeklyStats.userId],
    references: [users.id],
  }),
}));

export const reminderSchedulesRelations = relations(reminderSchedules, ({ one }) => ({
  user: one(users, {
    fields: [reminderSchedules.userId],
    references: [users.id],
  }),
}));

export const userPrinciplesRelations = relations(userPrinciples, ({ one }) => ({
  user: one(users, {
    fields: [userPrinciples.userId],
    references: [users.id],
  }),
  principle: one(principles, {
    fields: [userPrinciples.principleId],
    references: [principles.id],
  }),
}));

export const principleHistoryRelations = relations(principleHistory, ({ one }) => ({
  user: one(users, {
    fields: [principleHistory.userId],
    references: [users.id],
  }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  user: one(users, {
    fields: [aiInsights.userId],
    references: [users.id],
  }),
  principle: one(principles, {
    fields: [aiInsights.principleId],
    references: [principles.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const aiRequestsRelations = relations(aiRequests, ({ one }) => ({
  user: one(users, {
    fields: [aiRequests.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrincipleSchema = createInsertSchema(principles).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type Principle = typeof principles.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
export type DailyStats = typeof dailyStats.$inferSelect;
export type WeeklyStats = typeof weeklyStats.$inferSelect;
export type ReminderSchedule = typeof reminderSchedules.$inferSelect;
export type InsertReminderSchedule = typeof reminderSchedules.$inferInsert;
export type UserPrinciple = typeof userPrinciples.$inferSelect;
export type InsertUserPrinciple = typeof userPrinciples.$inferInsert;
export type PrincipleHistory = typeof principleHistory.$inferSelect;
export type InsertPrincipleHistory = typeof principleHistory.$inferInsert;
export type AIInsight = typeof aiInsights.$inferSelect;
export type InsertAIInsight = typeof aiInsights.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type AIRequest = typeof aiRequests.$inferSelect;
export type InsertAIRequest = typeof aiRequests.$inferInsert;
export type AICache = typeof aiCache.$inferSelect;
export type InsertAICache = typeof aiCache.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
