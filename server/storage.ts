import { 
  users, 
  principles, 
  journalEntries, 
  userStats,
  type User, 
  type InsertUser,
  type Principle,
  type JournalEntry,
  type InsertJournalEntry,
  type UserStats
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
  
  // Principle methods
  getAllPrinciples(): Promise<Principle[]>;
  getPrincipleByNumber(number: number): Promise<Principle | undefined>;
  createOrUpdatePrinciple(principleData: any): Promise<Principle>;
  
  // Journal methods
  getUserJournalEntries(userId: number, limit?: number, offset?: number): Promise<JournalEntry[]>;
  getJournalEntry(id: number): Promise<JournalEntry | undefined>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry>;
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
    // Get current stats
    let stats = await this.getUserStats(userId);
    if (!stats) {
      stats = await this.initializeUserStats(userId);
    }

    // Get total entries count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId));

    // Calculate streak (simplified - just check if entry exists today)
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = await db
      .select()
      .from(journalEntries)
      .where(sql`${journalEntries.userId} = ${userId} AND DATE(${journalEntries.createdAt}) = ${today}`);

    const streakDays = todayEntries.length > 0 ? (stats.streakDays || 0) + 1 : (stats.streakDays || 0);

    const [updatedStats] = await db
      .update(userStats)
      .set({
        totalEntries: count,
        streakDays,
        lastEntryDate: new Date()
      })
      .where(eq(userStats.userId, userId))
      .returning();

    return updatedStats;
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
}

export const storage = new DatabaseStorage();