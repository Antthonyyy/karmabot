import { pgTable, text, integer, timestamp, boolean, numeric, serial, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Users table - matching actual database structure
export const users = pgTable("users", {
  id: serial().primaryKey(),
  telegramId: varchar("telegram_id"),
  telegramChatId: varchar("telegram_chat_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  username: text(),
  currentPrinciple: integer("current_principle"),
  timezoneOffset: integer("timezone_offset"),
  notificationType: varchar("notification_type"),
  customTimes: jsonb("custom_times"),
  language: varchar(),
  isActive: boolean("is_active"),
  reminderMode: text("reminder_mode"),
  dailyPrinciplesCount: integer("daily_principles_count"),
  timezone: text(),
  remindersEnabled: boolean("reminders_enabled"),
  lastReminderSent: timestamp("last_reminder_sent", { mode: "string" }),
  hasCompletedOnboarding: boolean("has_completed_onboarding"),
  subscription: text(),
  subscriptionStartDate: timestamp("subscription_start_date", { mode: "string" }),
  subscriptionEndDate: timestamp("subscription_end_date", { mode: "string" }),
  preferredLanguage: text("preferred_language"),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
  avatarUrl: text("avatar_url"),
});

// Principles table - matching actual database structure
export const principles = pgTable("principles", {
  id: serial().primaryKey(),
  number: integer().notNull(),
  title: text().notNull(),
  description: text().notNull(),
  url: text(),
  reflections: text(),
  practicalSteps: jsonb("practical_steps"),
});

// Journal entries table - matching actual database structure
export const journalEntries = pgTable("journal_entries", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  principleId: integer("principle_id").notNull(),
  content: text().notNull(),
  mood: varchar(),
  energyLevel: integer("energy_level"),
  isCompleted: boolean("is_completed"),
  isSkipped: boolean("is_skipped"),
  source: varchar(),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

// Subscriptions table - matching actual database structure
export const subscriptions = pgTable("subscriptions", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  plan: text().notNull(),
  billingPeriod: text("billing_period"),
  startDate: timestamp("start_date", { mode: "string" }),
  endDate: timestamp("end_date", { mode: "string" }),
  status: text().notNull(),
  paymentOrderId: text("payment_order_id"),
  amount: numeric({ precision: 10, scale: 2 }),
  currency: text(),
  createdAt: timestamp("created_at", { mode: "string" }),
  startedAt: timestamp("started_at", { mode: "string" }),
  expiresAt: timestamp("expires_at", { mode: "string" }),
});

// Minimal table definitions for other dependencies
export const userStats = pgTable("user_stats", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  currentStreak: integer("current_streak"),
  longestStreak: integer("longest_streak"),
  totalEntries: integer("total_entries"),
  lastEntryDate: timestamp("last_entry_date", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const dailyStats = pgTable("daily_stats", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  date: text().notNull(),
  entriesCount: integer("entries_count"),
  principlesCompleted: integer("principles_completed"),
  averageMoodScore: numeric("average_mood_score"),
  averageEnergyLevel: numeric("average_energy_level"),
  streakDay: integer("streak_day"),
  goalCompletion: numeric("goal_completion"),
  createdAt: timestamp("created_at", { mode: "string" }),
});

export const weeklyStats = pgTable("weekly_stats", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  weekStart: text("week_start").notNull(),
  weekEnd: text("week_end").notNull(),
  entriesCount: integer("entries_count"),
  principlesCompleted: integer("principles_completed"),
  averageMoodScore: numeric("average_mood_score"),
  averageEnergyLevel: numeric("average_energy_level"),
  goalCompletion: numeric("goal_completion"),
  createdAt: timestamp("created_at", { mode: "string" }),
});

export const reminderSchedules = pgTable("reminder_schedules", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  type: text().notNull(),
  time: text().notNull(),
  enabled: boolean(),
  principleNumber: integer("principle_number"),
  customMessage: text("custom_message"),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const userPrinciples = pgTable("user_principles", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  principleId: integer("principle_id").notNull(),
  status: text(),
  completedAt: timestamp("completed_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

export const principleHistory = pgTable("principle_history", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  principleId: integer("principle_id").notNull(),
  action: text().notNull(),
  createdAt: timestamp("created_at", { mode: "string" }),
});

export const achievements = pgTable("achievements", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  type: text().notNull(),
  title: text().notNull(),
  description: text(),
  notified: boolean(),
  unlockedAt: timestamp("unlocked_at", { mode: "string" }),
});

export const userSessions = pgTable("user_sessions", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  sessionToken: text("session_token").notNull(),
  expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }),
});

export const aiInsights = pgTable("ai_insights", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  principleId: integer("principle_id").notNull(),
  insightText: text("insight_text").notNull(),
  createdDate: timestamp("created_date", { mode: "string" }),
  interactions: jsonb(),
});

export const aiRequests = pgTable("ai_requests", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  type: text().notNull(),
  tokensUsed: integer("tokens_used"),
  cost: numeric({ precision: 10, scale: 4 }),
  model: text(),
  prompt: text(),
  response: text(),
  createdAt: timestamp("created_at", { mode: "string" }),
});

export const aiCache = pgTable("ai_cache", {
  id: serial().primaryKey(),
  questionHash: text("question_hash").notNull(),
  response: text().notNull(),
  language: text(),
  expiresAt: timestamp("expires_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial().primaryKey(),
  userId: integer("user_id").notNull(),
  endpoint: text().notNull(),
  p256Dh: text("p256dh").notNull(),
  auth: text().notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { mode: "string" }),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Principle = typeof principles.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;
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

// Zod schemas for validation
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});