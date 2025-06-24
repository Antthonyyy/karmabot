import { Router } from 'express';
import { authenticateToken } from '../auth.js';
import { requireSubscription } from '../middleware/subscription.js';
import { AIAssistant } from '../services/ai-assistant.js';
import type { AuthRequest } from '../auth.js';

console.log('AI routes file loaded');

const router = Router();

// Add debugging middleware
router.use((req, res, next) => {
  console.log('AI route accessed:', req.method, req.path);
  next();
});

router.post('/advice', authenticateToken, requireSubscription('plus'), async (req: AuthRequest, res) => {
  try {
    console.log('Getting AI advice for user:', req.user?.id);
    
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const aiAssistant = new AIAssistant();
    const advice = await aiAssistant.analyzeUserEntries(req.user.id);
    
    console.log('Generated advice:', advice);
    
    if (!advice) {
      throw new Error('No advice generated');
    }
    
    res.json({ advice });
  } catch (error) {
    console.error('AI Advice Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get AI advice'
    });
  }
});

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

    const aiAssistant = new AIAssistant();
    
    // Add system context for chat
    const chatMessages = [
      {
        role: 'system',
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
      ...messages
    ];

    const response = await aiAssistant.openai.chat.completions.create({
      model: 'gpt-4o',
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