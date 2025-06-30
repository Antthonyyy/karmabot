import { Router } from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import { authenticateToken, type AuthRequest } from '../auth';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({ storage: multer.memoryStorage() });

router.post('/transcribe', authenticateToken, upload.single('audio'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'NO_FILE' });

    const language = (req.body.language || 'uk').slice(0, 2);

    const rsp = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: new File([req.file.buffer], req.file.originalname || 'voice.webm', {
        type: req.file.mimetype,
      }),
      language
    });

    return res.json({ text: rsp.text });
  } catch (e) {
    console.error('Whisper error', e?.message);
    return res.status(500).json({ error: 'TRANSCRIBE_FAIL' });
  }
});

export default router;