import { storage } from '../storage';
import { InsertAchievement } from '@shared/schema';

export class AchievementService {
  // Check and unlock achievements for user
  async checkAchievements(userId: number): Promise<void> {
    try {
      const userStats = await storage.getUserStats(userId);
      const journalEntries = await storage.getUserJournalEntries(userId, 1000);
      const existingAchievements = await storage.getUserAchievements(userId);
      
      const achievementTypes = existingAchievements.map(a => a.type);
      const newAchievements: InsertAchievement[] = [];

      // First entry achievement
      if (!achievementTypes.includes('first_entry') && journalEntries.length >= 1) {
        newAchievements.push({
          userId,
          type: 'first_entry'
        });
      }

      // Entry count achievements
      if (!achievementTypes.includes('50_entries') && journalEntries.length >= 50) {
        newAchievements.push({
          userId,
          type: '50_entries'
        });
      }

      if (!achievementTypes.includes('100_entries') && journalEntries.length >= 100) {
        newAchievements.push({
          userId,
          type: '100_entries'
        });
      }

      // Streak achievements
      const currentStreak = await this.calculateCurrentStreak(userId);
      
      if (!achievementTypes.includes('7_days_streak') && currentStreak >= 7) {
        newAchievements.push({
          userId,
          type: '7_days_streak'
        });
      }

      if (!achievementTypes.includes('30_days_streak') && currentStreak >= 30) {
        newAchievements.push({
          userId,
          type: '30_days_streak'
        });
      }

      // Special achievements
      const gratitudeEntries = journalEntries.filter(entry => 
        entry.content.toLowerCase().includes('дякую') || 
        entry.content.toLowerCase().includes('вдячн')
      );

      if (!achievementTypes.includes('gratitude_master') && gratitudeEntries.length >= 20) {
        newAchievements.push({
          userId,
          type: 'gratitude_master'
        });
      }

      // User completed all 10 principles
      const user = await storage.getUser(userId);
      if (!achievementTypes.includes('karma_champion') && user && user.currentPrinciple > 10) {
        newAchievements.push({
          userId,
          type: 'karma_champion'
        });
      }

      // Create new achievements
      for (const achievement of newAchievements) {
        await storage.createAchievement(achievement);
      }

    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  // Calculate current streak
  private async calculateCurrentStreak(userId: number): Promise<number> {
    try {
      const entries = await storage.getUserJournalEntries(userId, 100);
      if (entries.length === 0) return 0;

      // Sort by date descending
      entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const entry of entries) {
        const entryDate = new Date(entry.createdAt);
        entryDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === streak) {
          streak++;
        } else if (daysDiff > streak) {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  }

  // Get user achievements
  async getUserAchievements(userId: number) {
    return await storage.getUserAchievements(userId);
  }

  // Mark achievement as notified
  async markAsNotified(achievementId: number): Promise<void> {
    await storage.markAchievementAsNotified(achievementId);
  }
}

export const achievementService = new AchievementService();