import { pgTable, foreignKey, serial, integer, text, date, jsonb, unique, timestamp, numeric, real, varchar, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const aiInsights = pgTable("ai_insights", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	principleId: integer("principle_id").notNull(),
	insightText: text("insight_text").notNull(),
	createdDate: date("created_date").defaultNow(),
	interactions: jsonb().default({}),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ai_insights_user_id_users_id_fk"
		}),
]);

export const aiCache = pgTable("ai_cache", {
	id: serial().primaryKey().notNull(),
	questionHash: text("question_hash").notNull(),
	response: text().notNull(),
	language: text().default('uk'),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("ai_cache_question_hash_unique").on(table.questionHash),
]);

export const aiRequests = pgTable("ai_requests", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	type: text().notNull(),
	tokensUsed: integer("tokens_used").default(0).notNull(),
	cost: numeric({ precision: 10, scale:  4 }).default('0').notNull(),
	model: text().default('gpt-4o').notNull(),
	prompt: text(),
	response: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ai_requests_user_id_users_id_fk"
		}),
]);

export const dailyStats = pgTable("daily_stats", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	date: date().notNull(),
	entriesCount: integer("entries_count").default(0),
	averageMood: real("average_mood"),
	averageEnergy: real("average_energy"),
	principlesWorked: jsonb("principles_worked"),
	reflectionTime: integer("reflection_time").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "daily_stats_user_id_users_id_fk"
		}),
]);

export const journalEntries = pgTable("journal_entries", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	principleId: integer("principle_id").notNull(),
	content: text().notNull(),
	mood: varchar(),
	energyLevel: integer("energy_level"),
	isCompleted: boolean("is_completed").default(false),
	isSkipped: boolean("is_skipped").default(false),
	source: varchar({ length: 50 }).default('web'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "journal_entries_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.principleId],
			foreignColumns: [principles.id],
			name: "journal_entries_principle_id_principles_id_fk"
		}),
]);

export const principles = pgTable("principles", {
	id: serial().primaryKey().notNull(),
	number: integer().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	url: text(),
	reflections: jsonb(),
	practicalSteps: jsonb("practical_steps"),
}, (table) => [
	unique("principles_number_unique").on(table.number),
]);

export const principleHistory = pgTable("principle_history", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	principleId: integer("principle_id").notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow(),
	completed: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "principle_history_user_id_users_id_fk"
		}),
]);

export const achievements = pgTable("achievements", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	type: text().notNull(),
	unlockedAt: timestamp("unlocked_at", { mode: 'string' }).defaultNow(),
	notified: boolean().default(false),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "achievements_user_id_users_id_fk"
		}),
]);

export const userPrinciples = pgTable("user_principles", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	principleId: integer("principle_id").notNull(),
	date: text().notNull(),
	principleOrder: integer("principle_order").default(1),
	reminderTime: text("reminder_time"),
	completed: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_principles_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.principleId],
			foreignColumns: [principles.id],
			name: "user_principles_principle_id_principles_id_fk"
		}),
]);

export const userSessions = pgTable("user_sessions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	telegramId: varchar("telegram_id", { length: 255 }),
	currentPrincipleContext: integer("current_principle_context"),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_sessions_user_id_users_id_fk"
		}),
	unique("user_sessions_telegram_id_unique").on(table.telegramId),
]);

export const userStats = pgTable("user_stats", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	streakDays: integer("streak_days").default(0),
	longestStreak: integer("longest_streak").default(0),
	totalEntries: integer("total_entries").default(0),
	currentCycle: integer("current_cycle").default(1),
	lastEntryDate: timestamp("last_entry_date", { mode: 'string' }),
	principleProgress: jsonb("principle_progress"),
	weeklyGoal: integer("weekly_goal").default(7),
	monthlyGoal: integer("monthly_goal").default(30),
	averageMood: real("average_mood"),
	averageEnergy: real("average_energy"),
	totalReflectionTime: integer("total_reflection_time").default(0),
	principleCompletions: jsonb("principle_completions"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_stats_user_id_users_id_fk"
		}),
]);

export const reminderSchedules = pgTable("reminder_schedules", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	time: text().notNull(),
	type: text().notNull(),
	enabled: boolean().default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reminder_schedules_user_id_users_id_fk"
		}),
]);

export const weeklyStats = pgTable("weekly_stats", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	weekStart: date("week_start").notNull(),
	weekEnd: date("week_end").notNull(),
	totalEntries: integer("total_entries").default(0),
	averageMood: real("average_mood"),
	averageEnergy: real("average_energy"),
	principlesProgress: jsonb("principles_progress"),
	goalCompletion: real("goal_completion"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "weekly_stats_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	telegramId: varchar("telegram_id"),
	telegramChatId: varchar("telegram_chat_id"),
	firstName: text("first_name").notNull(),
	lastName: text("last_name"),
	username: text(),
	currentPrinciple: integer("current_principle").default(1),
	timezoneOffset: integer("timezone_offset").default(0),
	notificationType: varchar("notification_type").default('daily'),
	customTimes: jsonb("custom_times"),
	language: varchar().default('uk'),
	isActive: boolean("is_active").default(true),
	reminderMode: text("reminder_mode").default('balanced'),
	dailyPrinciplesCount: integer("daily_principles_count").default(2),
	timezone: text().default('Europe/Kiev'),
	remindersEnabled: boolean("reminders_enabled").default(true),
	lastReminderSent: timestamp("last_reminder_sent", { mode: 'string' }),
	hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
	subscription: text().default('none'),
	subscriptionStartDate: timestamp("subscription_start_date", { mode: 'string' }),
	subscriptionEndDate: timestamp("subscription_end_date", { mode: 'string' }),
	preferredLanguage: text("preferred_language").default('uk'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	avatarUrl: text("avatar_url"),
}, (table) => [
	unique("users_telegram_id_unique").on(table.telegramId),
]);

export const subscriptions = pgTable("subscriptions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	plan: text().default('trial').notNull(),
	billingPeriod: text("billing_period"),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	status: text().default('active').notNull(),
	paymentOrderId: text("payment_order_id"),
	amount: numeric({ precision: 10, scale:  2 }),
	currency: text().default('EUR'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subscriptions_user_id_users_id_fk"
		}),
]);

export const pushSubscriptions = pgTable("push_subscriptions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	endpoint: text().notNull(),
	p256Dh: text().notNull(),
	auth: text().notNull(),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "push_subscriptions_user_id_users_id_fk"
		}),
]);
