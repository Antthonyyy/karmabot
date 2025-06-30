import { Router } from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import { authenticateToken, type AuthRequest } from '../auth.js';

const router = Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Transcribe audio using OpenAI Whisper
router.post('/transcribe', authenticateToken, upload.single('audio'), async (req: AuthRequest, res) => {
  try {
    console.log('Audio transcription request received');
    console.log('Request details:', {
      hasFile: !!req.file,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype,
      language: req.body.language,
      userId: req.user?.id
    });
    
    if (!req.file) {
      console.log('No audio file found in request');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Detect user's preferred language for better transcription
    const user = req.user;
    let language = 'uk'; // Default to Ukrainian
    let prompt = 'Це запис українською мовою про кармічний розвиток та духовну практику.';
    
    // Check user's language preference or request body
    const requestedLanguage = req.body.language || user?.language;
    
    if (requestedLanguage) {
      switch (requestedLanguage) {
        case 'ru':
          language = 'ru';
          prompt = 'Это запись на русском языке о кармическом развитии и духовной практике.';
          break;
        case 'en':
          language = 'en';
          prompt = 'This is a recording in English about karmic development and spiritual practice.';
          break;
        case 'uk':
        default:
          language = 'uk';
          prompt = 'Це запис українською мовою про кармічний розвиток та духовну практику.';
      }
    }

    // Convert audio buffer to File-like object for OpenAI
    const audioFile = new File([req.file.buffer], req.file.originalname || 'audio.webm', {
      type: req.file.mimetype,
    });

    // Use OpenAI Whisper for transcription
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language,
      prompt: prompt,
      response_format: 'json',
    });

    res.json({
      text: transcription.text,
    });

  } catch (error) {
    console.error('Audio transcription error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fileSize: req.file ? req.file.size : 'unknown',
      mimeType: req.file ? req.file.mimetype : 'unknown',
      language: requestedLanguage || 'uk'
    });
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid file format') || error.message.includes('unsupported')) {
        return res.status(400).json({ 
          error: 'Непідтримуваний формат аудіо файлу' 
        });
      }
      
      if (error.message.includes('File too large') || error.message.includes('size')) {
        return res.status(400).json({ 
          error: 'Файл занадто великий (максимум 25MB)' 
        });
      }
      
      if (error.message.includes('API key') || error.message.includes('unauthorized')) {
        return res.status(500).json({ 
          error: 'Помилка конфігурації API'
        });
      }
    }

    res.status(500).json({ 
      error: 'Помилка обробки аудіо'
    });
  }
});

export default router;