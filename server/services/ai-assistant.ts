import OpenAI from "openai";
import { storage } from "../storage.js";

export class AIAssistant {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.api_key_openai;
    if (!apiKey) {
      console.error('OpenAI API key is missing! Checked: OPENAI_API_KEY, api_key_openai');
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    
    console.log('🤖 OpenAI API key found, initializing client...');
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  async analyzeUserEntries(userId: number): Promise<string> {
    try {
      // Get user's recent journal entries
      const entries = await storage.getUserJournalEntries(userId, 10);
      
      if (entries.length === 0) {
        return "Почніть вести щоденник, і я зможу дати вам персональні поради на основі ваших записів!";
      }

      // Get user info for personalization
      const user = await storage.getUser(userId);
      const userName = user?.firstName || "друже";

      // Prepare entries text for analysis
      const entriesText = entries
        .map((entry, index) => `Запис ${index + 1}: ${entry.content}`)
        .join('\n\n');

      const prompt = `Ви - мудрий наставник з духовного розвитку. Проаналізуйте записи користувача з кармічного щоденника і дайте персональну пораду.

Записи користувача:
${entriesText}

Дайте конструктивну, підтримуючу пораду українською мовою (2-3 речення) що допоможе користувачу ${userName} у духовному розвитку. Сфокусуйтеся на позитивних моментах та конкретних кроках для зростання.

Відповідь повинна бути:
- Персоналізованою
- Мотивуючою
- Практичною
- На українській мові`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Using stable model for better compatibility
        messages: [
          {
            role: "system",
            content: "Ви - експерт з духовного розвитку та кармічних практик. Надавайте мудрі, підтримуючі поради українською мовою."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || "Продовжуйте вести щоденник і практикувати кармічні принципи. Ваш духовний розвиток - це подорож, кожен крок якої має значення.";

    } catch (error) {
      console.error('AI Assistant detailed error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
        type: error.type
      });
      throw new Error("Не вдалося проаналізувати ваші записи. Спробуйте пізніше.");
    }
  }

  async generatePersonalizedInsight(userId: number, principleId: number): Promise<string> {
    try {
      // Get user's entries related to this principle
      const entries = await storage.getUserJournalEntries(userId, 5);
      const principleEntries = entries.filter(entry => entry.principleId === principleId);
      
      // Get principle info
      const principle = await storage.getPrincipleByNumber(principleId);
      if (!principle) {
        throw new Error("Principle not found");
      }

      let context = "";
      if (principleEntries.length > 0) {
        context = `Попередні записи користувача по цьому принципу:\n${principleEntries.map(e => e.content).join('\n')}\n\n`;
      }

      const prompt = `${context}Дайте персональну підказку для практики принципу "${principle.title}" - ${principle.description}. 

Відповідь повинна бути:
- 1-2 речення
- Конкретною та практичною
- Мотивуючою
- На українській мові`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Using stable model for better compatibility
        messages: [
          {
            role: "system", 
            content: "Ви - наставник з кармічних практик. Надавайте короткі, практичні поради українською мовою."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      return response.choices[0]?.message?.content || `Сьогодні зосередьтеся на практиці принципу "${principle.title}" у повсякденних справах.`;

    } catch (error) {
      console.error('AI Assistant detailed error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
        type: error.type
      });
      throw new Error("Не вдалося згенерувати підказку. Спробуйте пізніше.");
    }
  }
}