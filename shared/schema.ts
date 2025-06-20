import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
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
  totalEntries: integer("total_entries").default(0),
  currentCycle: integer("current_cycle").default(1),
  lastEntryDate: timestamp("last_entry_date"),
  principleProgress: jsonb("principle_progress"),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  journalEntries: many(journalEntries),
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
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
