import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
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

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite middleware for React SPA
  const vite = await setupVite(app);
  
  // Serve static files from client/public
  app.use(express.static(path.join(process.cwd(), 'client', 'public')));

  // Catch-all handler - serve React SPA for all non-API routes
  app.get('*', async (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    try {
      // Serve the main React app for all routes
      const htmlPath = path.join(process.cwd(), 'client', 'index.html');
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      // Inject the Google Client ID if needed
      const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
      html = html.replace(/YOUR_GOOGLE_CLIENT_ID/g, googleClientId);
      
      // Transform HTML through Vite if available
      if (vite) {
        html = await vite.transformIndexHtml(req.originalUrl, html);
      }
      
      res.send(html);
    } catch (error) {
      console.error('Error serving SPA:', error);
      res.status(500).send('Server error');
    }
  });

  

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
