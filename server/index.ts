import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { setupSecurity, rateLimitErrorHandler } from "./middleware/security";
import initSentry, { sentryRequestHandler, sentryErrorHandler } from "./utils/sentry";
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
import { checkEnvVariables, logEnvStatus } from "./utils/env-check";

// Telegram bot singleton initialization
import { initBot } from "./bot/index";
import TelegramBot from "node-telegram-bot-api";

declare global {
  var telegramBotInstance: TelegramBot | undefined;
}

if (global.telegramBotInstance) {
  console.log("⚠️  Bot already running – skip init");
} else {
  global.telegramBotInstance = initBot();
}

import { initTrialExpirationCron } from "./cron/trialExpire.js";

// Проверяем переменные окружения при запуске
if (!checkEnvVariables()) {
  console.log('⚠️  Настройте переменные окружения и перезапустите сервер');
}

// Показываем статус всех переменных окружения
logEnvStatus();

// Initialize Sentry for error tracking
initSentry();

const app = express();

// Sentry request handler must be first
app.use(sentryRequestHandler());

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup security middleware
setupSecurity(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Initialize trial expiration cron job
  initTrialExpirationCron();

  // Rate limit error handler
  app.use(rateLimitErrorHandler);

  // Sentry error handler must be before other error handlers
  app.use(sentryErrorHandler());

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Conditionally setup Vite or serve static files
  if (process.env.NODE_ENV === 'production') {
    // In production, serve static files from the 'dist' directory
    const distPath = path.join(process.cwd(), 'dist');
    const publicPath = path.join(distPath, 'public');
    
    // Serve static files from dist root and public folder
    app.use(express.static(distPath));
    app.use(express.static(publicPath));
    console.log(`✅ Serving static files from: ${distPath} and ${publicPath}`);

    // And serve the index.html for all non-API GET routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.method !== 'GET') {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // In development, setup Vite middleware for React SPA
    const vite = await setupVite(app);
    
    // In dev, Vite handles serving index.html via a catch-all handler
    app.get('*', async (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ message: 'API endpoint not found' });
      }
      
      try {
        const htmlPath = path.join(process.cwd(), 'client', 'index.html');
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
        html = html.replace(/YOUR_GOOGLE_CLIENT_ID/g, googleClientId);
        
        if (vite) {
          html = await vite.transformIndexHtml(req.originalUrl, html);
        }
        
        res.send(html);
      } catch (error) {
        console.error('Error serving SPA via Vite:', error);
        vite?.ssrFixStacktrace(error as Error);
        res.status(500).send('Server error');
      }
    });
    console.log('✅ Vite middleware configured for development');
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    console.log('========== SERVER RESTARTED AT', new Date().toISOString(), '==========');
    console.log('✅ GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : '❌ NOT FOUND');
    console.log('🔑 Google OAuth Config:', {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientIdLength: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.length : 0,
      redirectUri: 'https://karma-traker.onrender.com/auth/callback'
    });
  });
})();
