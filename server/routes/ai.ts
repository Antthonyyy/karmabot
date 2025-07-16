import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../auth.js';
import { requireSubscription } from '../middleware/subscription.js';
import { AIAssistant } from '../services/ai-assistant.js';
import { storage } from '../storage.js';
import type { AuthRequest } from '../auth.js';

console.log('AI routes file loaded');

const router = Router();

// ИСПРАВЛЕНИЕ: Добавляем rate limiting для AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // максимум 20 AI запросов за 15 минут
  message: {
    error: 'Too many AI requests, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Add debugging middleware
router.use((req, res, next) => {
  console.log('AI route accessed:', req.method, req.path);
  next();
});

// Apply rate limiting to all AI routes
router.use(aiRateLimit);

// УДАЛЁН НЕБЕЗОПАСНЫЙ TEST ENDPOINT
// Endpoint /create-test-subscription удален как критическая уязвимость безопасности

router.get('/insight/:principleId', authenticateToken, requireSubscription('plus'), async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const principleId = parseInt(req.params.principleId);
    if (isNaN(principleId)) {
      return res.status(400).json({ error: 'Invalid principle ID' });
    }

    const aiAssistant = new AIAssistant();
    const insight = await aiAssistant.generatePersonalizedInsight(req.user.id, principleId);
    
    res.json({ insight });
  } catch (error) {
    console.error('AI insight error:', error);
    res.status(500).json({ error: 'Failed to get AI insight' });
  }
});

router.post('/chat', authenticateToken, requireSubscription('pro'), async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { messages, language = 'uk' } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Защита от Prompt Injection - санитизация сообщений
    const sanitizedMessages = messages.map(msg => {
      if (typeof msg.content !== 'string') {
        throw new Error('Invalid message content');
      }
      
      return {
        role: 'user' as const, // Принудительно устанавливаем role как user для безопасности
        content: msg.content
          .replace(/system\s*:/gi, '')
          .replace(/assistant\s*:/gi, '')
          .replace(/user\s*:/gi, '')
          .replace(/<[^>]*>/g, '') // Удаляем HTML теги
          .trim()
      };
    });

    // Дополнительная валидация длины сообщений
    for (const msg of sanitizedMessages) {
      if (msg.content.length > 1000) {
        return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
      }
    }

    const aiAssistant = new AIAssistant();
    
    // Add system context for chat - правильная типизация для OpenAI API
    const chatMessages: Array<{role: 'system' | 'user'; content: string}> = [
      {
        role: 'system' as const,
        content: language === 'uk' 
          ? `Ти досвідчений психолог-консультант з глибоким розумінням кармічних практик. 
            Відповідай українською мовою.
            Твої поради мають бути:
            - Емпатичними та підтримуючими
            - Конкретними та практичними
            - Безпечними та етичними
            - Враховувати індивідуальний контекст людини
            Уникай загальних фраз, давай персоналізовані рекомендації.`
          : `You are an experienced psychologist-consultant with deep understanding of karmic practices.
            Your advice should be:
            - Empathetic and supportive
            - Concrete and practical
            - Safe and ethical
            - Consider individual context
            Avoid generic phrases, give personalized recommendations.`
      },
      ...sanitizedMessages
    ];

    const response = await aiAssistant.openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: chatMessages,
      max_tokens: 500,
      temperature: 0.7
    });

    const reply = response.choices[0]?.message?.content;
    if (!reply) {
      throw new Error('No response from AI');
    }

    res.json({ reply });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;