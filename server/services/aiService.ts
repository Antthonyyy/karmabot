import { db } from "../db";
import { aiInsights, journalEntries, principles } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Fallback insights for when AI is not available
const FALLBACK_INSIGHTS = {
  1: "Сьогодні спробуй помітити моменти, коли твоя поведінка може вплинути на інших людей.",
  2: "Зверни увагу на те, як чесність у дрібницях впливає на твоє самопочуття.",
  3: "Що б сталося, якби ти сьогодні взяв лише те, що дійсно потрібно?",
  4: "Сьогодні спробуй знайти красу в простих, природних моментах дня.",
  5: "Зверни увагу на те, як контроль над своїми бажаннями впливає на твій внутрішній спокій.",
  6: "Що б сталося, якби ти сьогодні робив кожну справу з повною увагою?",
  7: "Сьогодні спробуй побачити навчальний момент у кожній складній ситуації.",
  8: "Зверни увагу на те, як твоє ставлення до роботи впливає на якість результату.",
  9: "Що б сталося, якби ти сьогодні виражав вдячність за кожну дрібницю?",
  10: "Сьогодні спробуй служити іншим, не очікуючи нічого натомість."
};

function getFallbackInsight(principleId: number): string {
  return FALLBACK_INSIGHTS[principleId as keyof typeof FALLBACK_INSIGHTS] || 
         "Сьогодні спробуй застосувати цей принцип у повсякденних справах.";
}

export async function getDailyInsight(
  principleId: number, 
  userId: number,
  regenerate: boolean = false
): Promise<string> {
  // Check for existing insight today
  if (!regenerate) {
    const existing = await db.select()
      .from(aiInsights)
      .where(
        and(
          eq(aiInsights.userId, userId),
          eq(aiInsights.principleId, principleId),
          eq(aiInsights.createdDate, sql`CURRENT_DATE`)
        )
      )
      .limit(1);
    
    if (existing[0]) {
      return existing[0].insightText;
    }
  }
  
  // For now, return fallback insight
  // TODO: Implement OpenAI integration when API key is available
  const insight = getFallbackInsight(principleId);
  
  // Save the insight
  try {
    await db.insert(aiInsights)
      .values({
        userId,
        principleId,
        insightText: insight,
        createdDate: sql`CURRENT_DATE`
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error('Error saving AI insight:', error);
  }
  
  return insight;
}

export async function generatePersonalizedInsight(
  principleId: number,
  userId: number
): Promise<string> {
  // Get recent journal entries for context
  const recentEntries = await db.select({
    content: journalEntries.content,
    createdAt: journalEntries.createdAt
  })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.principleId, principleId)
      )
    )
    .orderBy(desc(journalEntries.createdAt))
    .limit(3);
  
  // For now, use enhanced fallback based on user activity
  let insight = getFallbackInsight(principleId);
  
  if (recentEntries.length > 0) {
    // Add personalized touch based on recent activity
    insight += " Роздумай над своїми останніми записами та спробуй застосувати новий підхід.";
  }
  
  return insight;
}