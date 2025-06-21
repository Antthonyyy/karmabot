import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, real, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  journalEntries: many(journalEntries),
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
  reminderSchedules: many(reminderSchedules),
  userPrinciples: many(userPrinciples),
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
