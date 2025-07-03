import { relations } from "drizzle-orm/relations";
import { users, aiInsights, aiRequests, dailyStats, journalEntries, principles, principleHistory, achievements, userPrinciples, userSessions, userStats, reminderSchedules, weeklyStats, subscriptions, pushSubscriptions } from "./schema";

export const aiInsightsRelations = relations(aiInsights, ({one}) => ({
	user: one(users, {
		fields: [aiInsights.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	aiInsights: many(aiInsights),
	aiRequests: many(aiRequests),
	dailyStats: many(dailyStats),
	journalEntries: many(journalEntries),
	principleHistories: many(principleHistory),
	achievements: many(achievements),
	userPrinciples: many(userPrinciples),
	userSessions: many(userSessions),
	userStats: many(userStats),
	reminderSchedules: many(reminderSchedules),
	weeklyStats: many(weeklyStats),
	subscriptions: many(subscriptions),
	pushSubscriptions: many(pushSubscriptions),
}));

export const aiRequestsRelations = relations(aiRequests, ({one}) => ({
	user: one(users, {
		fields: [aiRequests.userId],
		references: [users.id]
	}),
}));

export const dailyStatsRelations = relations(dailyStats, ({one}) => ({
	user: one(users, {
		fields: [dailyStats.userId],
		references: [users.id]
	}),
}));

export const journalEntriesRelations = relations(journalEntries, ({one}) => ({
	user: one(users, {
		fields: [journalEntries.userId],
		references: [users.id]
	}),
	principle: one(principles, {
		fields: [journalEntries.principleId],
		references: [principles.id]
	}),
}));

export const principlesRelations = relations(principles, ({many}) => ({
	journalEntries: many(journalEntries),
	userPrinciples: many(userPrinciples),
}));

export const principleHistoryRelations = relations(principleHistory, ({one}) => ({
	user: one(users, {
		fields: [principleHistory.userId],
		references: [users.id]
	}),
}));

export const achievementsRelations = relations(achievements, ({one}) => ({
	user: one(users, {
		fields: [achievements.userId],
		references: [users.id]
	}),
}));

export const userPrinciplesRelations = relations(userPrinciples, ({one}) => ({
	user: one(users, {
		fields: [userPrinciples.userId],
		references: [users.id]
	}),
	principle: one(principles, {
		fields: [userPrinciples.principleId],
		references: [principles.id]
	}),
}));

export const userSessionsRelations = relations(userSessions, ({one}) => ({
	user: one(users, {
		fields: [userSessions.userId],
		references: [users.id]
	}),
}));

export const userStatsRelations = relations(userStats, ({one}) => ({
	user: one(users, {
		fields: [userStats.userId],
		references: [users.id]
	}),
}));

export const reminderSchedulesRelations = relations(reminderSchedules, ({one}) => ({
	user: one(users, {
		fields: [reminderSchedules.userId],
		references: [users.id]
	}),
}));

export const weeklyStatsRelations = relations(weeklyStats, ({one}) => ({
	user: one(users, {
		fields: [weeklyStats.userId],
		references: [users.id]
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id]
	}),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({one}) => ({
	user: one(users, {
		fields: [pushSubscriptions.userId],
		references: [users.id]
	}),
}));