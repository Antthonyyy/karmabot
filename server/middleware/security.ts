import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

// ИСПРАВЛЕНИЕ Information Disclosure: Стандартизированный error handler
export const standardErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Логируем полную ошибку для debugging
  console.error('Error occurred:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Определяем статус код
  const statusCode = err.statusCode || err.status || 500;
  
  // В production не раскрываем детали ошибок
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse: any = {
    error: true,
    message: statusCode === 500 ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString(),
    path: req.url
  };

  // В development добавляем дополнительную информацию
  if (isDevelopment) {
    errorResponse.details = err.message;
    errorResponse.stack = err.stack;
  }

  // Специальная обработка для различных типов ошибок
  if (err.name === 'ValidationError') {
    errorResponse.message = 'Invalid input data';
    return res.status(400).json(errorResponse);
  }
  
  if (err.name === 'UnauthorizedError' || statusCode === 401) {
    errorResponse.message = 'Authentication required';
    return res.status(401).json(errorResponse);
  }
  
  if (err.name === 'ForbiddenError' || statusCode === 403) {
    errorResponse.message = 'Access forbidden';
    return res.status(403).json(errorResponse);
  }

  res.status(statusCode).json(errorResponse);
};

// Input validation middleware
export const inputValidation = (req: Request, res: Response, next: NextFunction) => {
  // Check for common injection patterns
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /union\s+select/gi,
    /drop\s+table/gi,
    /insert\s+into/gi,
    /delete\s+from/gi,
    /update\s+set/gi
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => checkValue(v));
    }
    return false;
  };

  // Check request body
  if (req.body && checkValue(req.body)) {
    console.warn('Suspicious input detected:', req.ip, req.path);
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  // Check query parameters
  if (req.query && checkValue(req.query)) {
    console.warn('Suspicious query detected:', req.ip, req.path);
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  next();
};

// Request sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

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
  // ИСПРАВЛЕНИЕ: Убираем exposedHeaders set-cookie для безопасности
  exposedHeaders: [],
};

// Helmet configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // ИСПРАВЛЕНИЕ: Добавляем 'unsafe-inline' для Google OAuth стилей
      styleSrc: ["'self'", "https://fonts.googleapis.com", "https://accounts.google.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      // ИСПРАВЛЕНИЕ: Убираем 'unsafe-inline' для scripts
      scriptSrc: ["'self'", "https://accounts.google.com", "https://apis.google.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.telegram.org", "https://accounts.google.com", "https://oauth2.googleapis.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      // ИСПРАВЛЕНИЕ: Добавляем дополнительные защитные директивы
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility with some third-party services
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // ИСПРАВЛЕНИЕ: Добавляем дополнительные security headers
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// Security middleware setup function
export const setupSecurity = (app: any) => {
  // Enable trust proxy for proper IP detection behind reverse proxy
  app.set('trust proxy', 1);

  // Apply helmet for security headers
  app.use(helmetConfig);

  // Apply CORS
  app.use(cors(corsOptions));

  // Apply input sanitization first
  app.use(sanitizeInput);

  // Apply input validation
  app.use(inputValidation);

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