import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

// Rate limiting configuration
export const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests
    skipSuccessfulRequests: false,
    // Skip failed requests
    skipFailedRequests: false,
  });
};

// Different rate limits for different endpoints
export const generalRateLimit = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authRateLimit = createRateLimiter(15 * 60 * 1000, 10); // 10 login attempts per 15 minutes
export const apiRateLimit = createRateLimiter(15 * 60 * 1000, 200); // 200 API calls per 15 minutes

// CORS configuration
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://karma-traker.onrender.com', 'https://karmabot.onrender.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
};

// Helmet configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://apis.google.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.telegram.org", "https://accounts.google.com", "https://oauth2.googleapis.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility with some third-party services
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Security middleware setup function
export const setupSecurity = (app: any) => {
  // Enable trust proxy for proper IP detection behind reverse proxy
  app.set('trust proxy', 1);

  // Apply helmet for security headers
  app.use(helmetConfig);

  // Apply CORS
  app.use(cors(corsOptions));

  // Apply general rate limiting
  app.use(generalRateLimit);

  // Apply specific rate limiting for auth endpoints
  app.use('/api/auth', authRateLimit);
  app.use('/api/login', authRateLimit);
  app.use('/api/telegram-auth', authRateLimit);
  app.use('/api/google-auth', authRateLimit);

  // Apply API rate limiting
  app.use('/api', apiRateLimit);

  console.log('🔒 Security middleware configured');
};

// Error handling middleware for rate limiting
export const rateLimitErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.statusCode === 429) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: error.retryAfter,
    });
  } else {
    next(error);
  }
}; 