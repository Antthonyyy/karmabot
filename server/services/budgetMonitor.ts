import { db } from '../db';
import { aiRequests } from '@shared/schema';
import { gte, sql, and, eq } from 'drizzle-orm';

export class BudgetMonitor {
  private readonly MONTHLY_LIMIT = 10; // $10
  private readonly COST_PER_1K_TOKENS = {
    'gpt-3.5-turbo': 0.0015, // $1.50 per 1M tokens
    'gpt-4': 0.03, // $30 per 1M tokens
    'gpt-4o': 0.005 // $5 per 1M tokens - the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  };

  async checkMonthlyBudget(): Promise<{ used: number; remaining: number; percentage: number }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const [result] = await db
      .select({ totalCost: sql<number>`COALESCE(SUM(cost), 0)` })
      .from(aiRequests)
      .where(gte(aiRequests.createdAt, startOfMonth));
    
    const used = result?.totalCost || 0;
    const remaining = Math.max(0, this.MONTHLY_LIMIT - used);
    const percentage = (used / this.MONTHLY_LIMIT) * 100;
    
    return { used, remaining, percentage };
  }

  async canMakeRequest(estimatedTokens: number = 200, model: string = 'gpt-4o'): Promise<boolean> {
    const { remaining } = await this.checkMonthlyBudget();
    const estimatedCost = (estimatedTokens / 1000) * this.COST_PER_1K_TOKENS[model];
    
    if (remaining < estimatedCost) {
      console.warn(`⚠️ Бюджет майже вичерпано! Залишилось: $${remaining.toFixed(2)}`);
      return false;
    }
    
    return true;
  }

  async recordUsage(userId: number, type: string, tokens: number, model: string = 'gpt-4o') {
    const cost = (tokens / 1000) * this.COST_PER_1K_TOKENS[model];
    
    await db.insert(aiRequests).values({
      userId,
      type,
      tokensUsed: tokens,
      cost,
      model,
      createdAt: new Date()
    });
    
    const { used, percentage } = await this.checkMonthlyBudget();
    
    if (percentage > 80) {
      console.warn(`⚠️ Використано ${percentage.toFixed(0)}% місячного бюджету ($${used.toFixed(2)}/$${this.MONTHLY_LIMIT})`);
    }
  }

  async getUserMonthlyUsage(userId: number): Promise<{ count: number; tokens: number; cost: number }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const [result] = await db
      .select({
        count: sql<number>`COUNT(*)`,
        tokens: sql<number>`COALESCE(SUM(tokens_used), 0)`,
        cost: sql<number>`COALESCE(SUM(cost), 0)`
      })
      .from(aiRequests)
      .where(and(
        eq(aiRequests.userId, userId),
        gte(aiRequests.createdAt, startOfMonth)
      ));
    
    return {
      count: result?.count || 0,
      tokens: result?.tokens || 0,
      cost: result?.cost || 0
    };
  }

  async getBudgetStatus() {
    const budget = await this.checkMonthlyBudget();
    const alertLevel = budget.percentage > 90 ? 'critical' : 
                     budget.percentage > 75 ? 'warning' : 'normal';
    
    return {
      ...budget,
      alertLevel,
      limit: this.MONTHLY_LIMIT
    };
  }
}

export const budgetMonitor = new BudgetMonitor();