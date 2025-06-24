import OpenAI from "openai";
import { storage } from "../storage.js";

export class AIAssistant {
  public openai: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || process.env.api_key_openai;
    
    // Используем GPT-4o для высокого качества психологических советов
    this.model = 'gpt-4o';
    
    if (!apiKey) {
      console.error('OpenAI API key is missing! Checked: OPENAI_API_KEY, api_key_openai');
      throw new Error("OPENAI_API_KEY environment variable is required");
    } else {
      console.log('OpenAI initialized with model:', this.model);
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey
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

      const prompt = `Проаналізуйте записи користувача з кармічного щоденника і дайте персональну пораду.

Записи користувача:
${entriesText}

Дайте конструктивну, підтримуючу пораду українською мовою (2-3 речення) що допоможе користувачу ${userName} у духовному розвитку. Сфокусуйтеся на позитивних моментах та конкретних кроках для зростання.

Відповідь повинна бути:
- Персоналізованою
- Мотивуючою
- Практичною
- На українській мові`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: `Ти досвідчений психолог-консультант з глибоким розумінням кармічних практик. 
            Твої поради мають бути:
            - Емпатичними та підтримуючими
            - Конкретними та практичними
            - Безпечними та етичними
            - Враховувати індивідуальний контекст людини
            Уникай загальних фраз, давай персоналізовані рекомендації.`
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
        model: this.model,
        messages: [
          {
            role: "system", 
            content: `Ти досвідчений психолог-консультант з глибоким розумінням кармічних практик. 
            Твої поради мають бути:
            - Емпатичними та підтримуючими
            - Конкретними та практичними
            - Безпечними та етичними
            - Враховувати індивідуальний контекст людини
            Уникай загальних фраз, давай персоналізовані рекомендації.`
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