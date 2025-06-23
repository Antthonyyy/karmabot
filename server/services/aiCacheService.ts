import crypto from 'crypto';
import { storage } from '../storage';
import { InsertAICache } from '@shared/schema';

export class AICacheService {
  // Generate hash for caching
  private generateHash(text: string, language: string = 'uk'): string {
    return crypto.createHash('sha256').update(`${text}-${language}`).digest('hex');
  }

  // Check if response exists in cache
  async getCachedResponse(question: string, language: string = 'uk'): Promise<string | null> {
    try {
      const hash = this.generateHash(question, language);
      const cached = await storage.getCachedAIResponse(hash);
      
      // Check if cache is expired
      if (cached && cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
        await storage.deleteCachedAIResponse(hash);
        return null;
      }
      
      return cached?.response || null;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  // Cache AI response
  async cacheResponse(question: string, response: string, language: string = 'uk', ttlDays: number = 7): Promise<void> {
    try {
      const hash = this.generateHash(question, language);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ttlDays);

      const cacheEntry: InsertAICache = {
        questionHash: hash,
        response,
        language,
        expiresAt
      };

      await storage.cacheAIResponse(cacheEntry);
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }

  // Clean expired cache entries
  async cleanExpiredCache(): Promise<void> {
    try {
      await storage.cleanExpiredAICache();
    } catch (error) {
      console.error('Error cleaning expired cache:', error);
    }
  }
}

export const aiCacheService = new AICacheService();