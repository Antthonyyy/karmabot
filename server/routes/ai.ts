import { Router } from 'express';
import { authenticateToken } from '../auth.js';
import { AIAssistant } from '../services/ai-assistant.js';
import type { AuthRequest } from '../auth.js';

const router = Router();

router.get('/api/ai/advice', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const aiAssistant = new AIAssistant();
    const advice = await aiAssistant.analyzeUserEntries(req.user.id);
    
    res.json({ advice });
  } catch (error) {
    console.error('AI advice error:', error);
    res.status(500).json({ error: 'Failed to get AI advice' });
  }
});

router.get('/api/ai/insight/:principleId', authenticateToken, async (req: AuthRequest, res) => {
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

export default router;