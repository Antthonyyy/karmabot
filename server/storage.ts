import { 
  users, 
  principles, 
  journalEntries, 
  userStats,
  dailyStats,
  weeklyStats,
  reminderSchedules,
  userPrinciples,
  type User, 
  type InsertUser,
  type Principle,
  type JournalEntry,
  type InsertJournalEntry,
  type UserStats,
  type DailyStats,
  type WeeklyStats,
  type ReminderSchedule,
  type InsertReminderSchedule,
  type UserPrinciple,
  type InsertUserPrinciple
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getActiveUsers(): Promise<User[]>;
  updateUserLastSent(id: number, date: Date): Promise<void>;
  
  // User stats methods
  getUserStats(userId: number): Promise<UserStats | undefined>;
  initializeUserStats(userId: number): Promise<UserStats>;
  updateUserStats(userId: number): Promise<UserStats>;
  
  // Analytics methods
  getDailyStats(userId: number, date: string): Promise<DailyStats | undefined>;
  getWeeklyStats(userId: number, weekStart: string): Promise<WeeklyStats | undefined>;
  getUserAnalytics(userId: number): Promise<any>;
  getMoodTrends(userId: number, days: number): Promise<any[]>;
  getEnergyTrends(userId: number, days: number): Promise<any[]>;
  getPrincipleProgress(userId: number): Promise<any[]>;
  getStreakAnalytics(userId: number): Promise<any>;
  updateDailyStats(userId: number, date: string): Promise<DailyStats>;
  updateWeeklyStats(userId: number, weekStart: string): Promise<WeeklyStats>;
  
  // Principle methods
  getAllPrinciples(): Promise<Principle[]>;
  getPrincipleByNumber(number: number): Promise<Principle | undefined>;
  createOrUpdatePrinciple(principleData: any): Promise<Principle>;
  
  // Journal methods
  getUserJournalEntries(userId: number, limit?: number, offset?: number): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry>;
  
  // Reminder methods
  getUserReminderSchedules(userId: number): Promise<ReminderSchedule[]>;
  createReminderSchedule(schedule: InsertReminderSchedule): Promise<ReminderSchedule>;
  deleteUserReminderSchedules(userId: number): Promise<void>;
  setupUserReminders(userId: number, config: {
    reminderMode: string;
    dailyPrinciplesCount: number;
    customSchedule?: Array<{ time: string; type: 'principle' | 'reflection'; enabled: boolean }>;
  }): Promise<User>;
  
  // User Principles methods
  getUserPrincipleForDate(userId: number, date: string, order: number): Promise<UserPrinciple | undefined>;
  createUserPrinciple(userPrinciple: InsertUserPrinciple): Promise<UserPrinciple>;
  getActiveReminders(): Promise<Array<ReminderSchedule & { user: User }>>;
  getNextPrincipleForUser(userId: number): Promise<Principle | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getActiveUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isActive, true));
  }

  async updateUserLastSent(id: number, date: Date): Promise<void> {
    await db
      .update(users)
      .set({ updatedAt: date })
      .where(eq(users.id, id));
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));
    return stats || undefined;
  }

  async initializeUserStats(userId: number): Promise<UserStats> {
    const [stats] = await db
      .insert(userStats)
      .values({
        userId,
        streakDays: 0,
        totalEntries: 0,
        currentCycle: 1,
        lastEntryDate: null,
        principleProgress: {}
      })
      .returning();
    return stats;
  }

  async updateUserStats(userId: number): Promise<UserStats> {
    const stats = await this.getUserStats(userId);
    if (!stats) {
      return await this.initializeUserStats(userId);
    }

    // Get total entries count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId));

    // Calculate current streak
    const streakData = await this.getStreakAnalytics(userId);
    const currentStreak = streakData.currentStreak;
    const longestStreak = Math.max(streakData.longestStreak, currentStreak);

    // Calculate average mood and energy
    const [moodEnergyData] = await db
      .select({
        avgMood: avg(journalEntries.mood),
        avgEnergy: avg(journalEntries.energyLevel)
      })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId));

    // Calculate principle progress
    const principleCompletions = await this.getPrincipleProgress(userId);

    const [updatedStats] = await db
      .update(userStats)
      .set({
        totalEntries: count,
        streakDays: currentStreak,
        longestStreak,
        averageMood: moodEnergyData.avgMood ? Number(moodEnergyData.avgMood) : null,
        averageEnergy: moodEnergyData.avgEnergy ? Number(moodEnergyData.avgEnergy) : null,
        principleCompletions: JSON.stringify(principleCompletions),
        lastEntryDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userStats.userId, userId))
      .returning();

    return updatedStats;
  }

  async getDailyStats(userId: number, date: string): Promise<DailyStats | undefined> {
    const [dailyStat] = await db
      .select()
      .from(dailyStats)
      .where(and(eq(dailyStats.userId, userId), eq(dailyStats.date, date)));
    return dailyStat || undefined;
  }

  async getWeeklyStats(userId: number, weekStart: string): Promise<WeeklyStats | undefined> {
    const [weeklyStat] = await db
      .select()
      .from(weeklyStats)
      .where(and(eq(weeklyStats.userId, userId), eq(weeklyStats.weekStart, weekStart)));
    return weeklyStat || undefined;
  }

  async updateDailyStats(userId: number, date: string): Promise<DailyStats> {
    // Get entries for the day
    const entries = await db
      .select()
      .from(journalEntries)
      .where(sql`${journalEntries.userId} = ${userId} AND DATE(${journalEntries.createdAt}) = ${date}`);

    const entriesCount = entries.length;
    const avgMood = entries.length > 0 ? entries.reduce((sum, e) => sum + (Number(e.mood) || 0), 0) / entries.length : null;
    const avgEnergy = entries.length > 0 ? entries.reduce((sum, e) => sum + (Number(e.energyLevel) || 0), 0) / entries.length : null;
    
    const principlesWorked = [...new Set(entries.map(e => e.principleId))];

    const existing = await this.getDailyStats(userId, date);
    
    if (existing) {
      const [updated] = await db
        .update(dailyStats)
        .set({
          entriesCount,
          averageMood: avgMood,
          averageEnergy: avgEnergy,
          principlesWorked: JSON.stringify(principlesWorked),
        })
        .where(eq(dailyStats.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(dailyStats)
        .values({
          userId,
          date,
          entriesCount,
          averageMood: avgMood,
          averageEnergy: avgEnergy,
          principlesWorked: JSON.stringify(principlesWorked),
        })
        .returning();
      return created;
    }
  }

  async getUserAnalytics(userId: number): Promise<any> {
    const stats = await this.getUserStats(userId);
    const streakAnalytics = await this.getStreakAnalytics(userId);
    const principleProgress = await this.getPrincipleProgress(userId);
    const moodTrends = await this.getMoodTrends(userId, 30);
    const energyTrends = await this.getEnergyTrends(userId, 30);

    return {
      overview: {
        totalEntries: stats?.totalEntries || 0,
        currentStreak: streakAnalytics.currentStreak,
        longestStreak: streakAnalytics.longestStreak,
        averageMood: stats?.averageMood || 0,
        averageEnergy: stats?.averageEnergy || 0,
        currentCycle: stats?.currentCycle || 1,
      },
      streaks: streakAnalytics,
      principleProgress,
      trends: {
        mood: moodTrends,
        energy: energyTrends,
      },
      goals: {
        weekly: stats?.weeklyGoal || 7,
        monthly: stats?.monthlyGoal || 30,
      }
    };
  }

  async getMoodTrends(userId: number, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const trends = await db
      .select({
        date: sql<string>`DATE(${journalEntries.createdAt})`,
        avgMood: avg(journalEntries.mood),
        count: count(journalEntries.id)
      })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          gte(journalEntries.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(${journalEntries.createdAt})`)
      .orderBy(sql`DATE(${journalEntries.createdAt})`);

    return trends.map(t => ({
      date: t.date,
      mood: Number(t.avgMood) || 0,
      entries: Number(t.count)
    }));
  }

  async getEnergyTrends(userId: number, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const trends = await db
      .select({
        date: sql<string>`DATE(${journalEntries.createdAt})`,
        avgEnergy: avg(journalEntries.energyLevel),
        count: count(journalEntries.id)
      })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          gte(journalEntries.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(${journalEntries.createdAt})`)
      .orderBy(sql`DATE(${journalEntries.createdAt})`);

    return trends.map(t => ({
      date: t.date,
      energy: Number(t.avgEnergy) || 0,
      entries: Number(t.count)
    }));
  }

  async getPrincipleProgress(userId: number): Promise<any[]> {
    const principleStats = await db
      .select({
        principleId: journalEntries.principleId,
        count: count(journalEntries.id),
        avgMood: avg(journalEntries.mood),
        avgEnergy: avg(journalEntries.energyLevel),
        lastEntry: sql<string>`MAX(${journalEntries.createdAt})`
      })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .groupBy(journalEntries.principleId);

    const allPrinciples = await this.getAllPrinciples();
    
    return allPrinciples.map(principle => {
      const stats = principleStats.find(s => s.principleId === principle.id);
      return {
        principleId: principle.id,
        principleNumber: principle.number,
        principleTitle: principle.title,
        entriesCount: stats?.count || 0,
        averageMood: Number(stats?.avgMood) || 0,
        averageEnergy: Number(stats?.avgEnergy) || 0,
        lastEntry: stats?.lastEntry || null,
        completionRate: ((stats?.count || 0) / Math.max(1, principleStats.reduce((sum, s) => sum + Number(s.count), 0))) * 100
      };
    });
  }

  async getStreakAnalytics(userId: number): Promise<any> {
    const entries = await db
      .select({
        date: sql<string>`DATE(${journalEntries.createdAt})`
      })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .groupBy(sql`DATE(${journalEntries.createdAt})`)
      .orderBy(desc(sql`DATE(${journalEntries.createdAt})`));

    if (entries.length === 0) {
      return { currentStreak: 0, longestStreak: 0, streakDates: [] };
    }

    const dates = entries.map(e => new Date(e.date));
    let currentStreak = 0;
    let longestStreak = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check current streak
    for (let i = 0; i < dates.length; i++) {
      const entryDate = new Date(dates[i]);
      entryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (entryDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let consecutiveDays = 1;
    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i-1]);
      const nextDate = new Date(dates[i]);
      
      const dayDiff = (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        consecutiveDays++;
      } else {
        longestStreak = Math.max(longestStreak, consecutiveDays);
        consecutiveDays = 1;
      }
    }
    longestStreak = Math.max(longestStreak, consecutiveDays);

    return {
      currentStreak,
      longestStreak,
      totalDaysWithEntries: entries.length,
      streakDates: dates.slice(0, currentStreak).map(d => d.toISOString().split('T')[0])
    };
  }

  async getAllPrinciples(): Promise<Principle[]> {
    return await db
      .select()
      .from(principles)
      .orderBy(principles.number);
  }

  async getPrincipleByNumber(number: number): Promise<Principle | undefined> {
    const [principle] = await db
      .select()
      .from(principles)
      .where(eq(principles.number, number));
    return principle || undefined;
  }

  async createOrUpdatePrinciple(principleData: any): Promise<Principle> {
    // Check if principle exists
    const existing = await this.getPrincipleByNumber(principleData.number);
    
    if (existing) {
      const [updated] = await db
        .update(principles)
        .set(principleData)
        .where(eq(principles.number, principleData.number))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(principles)
        .values(principleData)
        .returning();
      return created;
    }
  }

  async getUserJournalEntries(userId: number, limit = 10, offset = 0): Promise<JournalEntry[]> {
    return await db
      .select({
        id: journalEntries.id,
        userId: journalEntries.userId,
        principleId: journalEntries.principleId,
        content: journalEntries.content,
        mood: journalEntries.mood,
        energyLevel: journalEntries.energyLevel,
        createdAt: journalEntries.createdAt,
        updatedAt: journalEntries.updatedAt,
        principle: principles
      })
      .from(journalEntries)
      .leftJoin(principles, eq(journalEntries.principleId, principles.id))
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getJournalEntry(id: number): Promise<JournalEntry | undefined> {
    const [entry] = await db
      .select({
        id: journalEntries.id,
        userId: journalEntries.userId,
        principleId: journalEntries.principleId,
        content: journalEntries.content,
        mood: journalEntries.mood,
        energyLevel: journalEntries.energyLevel,
        createdAt: journalEntries.createdAt,
        updatedAt: journalEntries.updatedAt,
        principle: principles
      })
      .from(journalEntries)
      .leftJoin(principles, eq(journalEntries.principleId, principles.id))
      .where(eq(journalEntries.id, id));
    return entry || undefined;
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [created] = await db
      .insert(journalEntries)
      .values(entry)
      .returning();
    return created;
  }

  async updateJournalEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    const [updated] = await db
      .update(journalEntries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(journalEntries.id, id))
      .returning();
    return updated;
  }

  // Reminder methods
  async getUserReminderSchedules(userId: number): Promise<ReminderSchedule[]> {
    return await db
      .select()
      .from(reminderSchedules)
      .where(eq(reminderSchedules.userId, userId))
      .orderBy(reminderSchedules.time);
  }

  async createReminderSchedule(schedule: InsertReminderSchedule): Promise<ReminderSchedule> {
    const [created] = await db
      .insert(reminderSchedules)
      .values(schedule)
      .returning();
    return created;
  }

  async deleteUserReminderSchedules(userId: number): Promise<void> {
    await db
      .delete(reminderSchedules)
      .where(eq(reminderSchedules.userId, userId));
  }

  async setupUserReminders(userId: number, config: {
    reminderMode: string;
    dailyPrinciplesCount: number;
    customSchedule?: Array<{ time: string; type: 'principle' | 'reflection'; enabled: boolean }>;
  }): Promise<User> {
    // Transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Update user profile
      const [updatedUser] = await tx
        .update(users)
        .set({
          reminderMode: config.reminderMode,
          dailyPrinciplesCount: config.dailyPrinciplesCount,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      // Delete old reminder schedules
      await tx
        .delete(reminderSchedules)
        .where(eq(reminderSchedules.userId, userId));

      // Create new reminder schedules
      if (config.reminderMode === 'custom' && config.customSchedule) {
        for (const item of config.customSchedule) {
          if (item.enabled) {
            await tx
              .insert(reminderSchedules)
              .values({
                userId,
                time: item.time,
                type: item.type,
                enabled: item.enabled,
              });
          }
        }
      } else {
        // Use predefined schedule
        const { getDefaultScheduleForMode } = await import('./config/reminderModes.js');
        const defaultSchedule = getDefaultScheduleForMode(config.reminderMode);
        
        for (const item of defaultSchedule) {
          await tx
            .insert(reminderSchedules)
            .values({
              userId,
              time: item.time,
              type: item.type,
              enabled: true,
            });
        }
      }

      return updatedUser;
    });
  }

  // User Principles methods
  async getUserPrincipleForDate(userId: number, date: string, order: number): Promise<UserPrinciple | undefined> {
    const [userPrinciple] = await db
      .select()
      .from(userPrinciples)
      .where(
        and(
          eq(userPrinciples.userId, userId),
          eq(userPrinciples.date, date),
          eq(userPrinciples.principleOrder, order)
        )
      );
    return userPrinciple || undefined;
  }

  async createUserPrinciple(userPrinciple: InsertUserPrinciple): Promise<UserPrinciple> {
    const [created] = await db
      .insert(userPrinciples)
      .values(userPrinciple)
      .returning();
    return created;
  }

  async getActiveReminders(): Promise<Array<ReminderSchedule & { user: User }>> {
    return await db
      .select({
        id: reminderSchedules.id,
        userId: reminderSchedules.userId,
        time: reminderSchedules.time,
        type: reminderSchedules.type,
        enabled: reminderSchedules.enabled,
        createdAt: reminderSchedules.createdAt,
        updatedAt: reminderSchedules.updatedAt,
        user: users,
      })
      .from(reminderSchedules)
      .innerJoin(users, eq(reminderSchedules.userId, users.id))
      .where(
        and(
          eq(reminderSchedules.enabled, true),
          eq(users.remindersEnabled, true),
          eq(users.isActive, true)
        )
      );
  }

  async getNextPrincipleForUser(userId: number): Promise<Principle | undefined> {
    // Get user's current principle
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // Get next principle in sequence (1-10, cycling)
    const nextNumber = (user.currentPrinciple % 10) + 1;
    return await this.getPrincipleByNumber(nextNumber);
  }

  async getPrinciplesSentToday(userId: number, date: string): Promise<number> {
    const sentToday = await db
      .select({ count: count() })
      .from(userPrinciples)
      .where(
        and(
          eq(userPrinciples.userId, userId),
          eq(userPrinciples.date, date)
        )
      );
    
    return sentToday[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();