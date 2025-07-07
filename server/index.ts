import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
// import { setupVite, serveStatic, log } from "./vite"; // Vite import disabled temporarily
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
// Import Telegram bot - only the original auth bot for now
import "./telegram-bot.ts";
import { initTrialExpirationCron } from "./cron/trialExpire.js";

// Проверяем переменные окружения при запуске
if (!checkEnvVariables()) {
  console.log('⚠️  Настройте переменные окружения и перезапустите сервер');
}

// Показываем статус всех переменных окружения
logEnvStatus();

const app = express();
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

  // Define custom routes BEFORE static middleware
  app.get('/', (req, res) => {
    // Read the HTML file and inject the real GOOGLE_CLIENT_ID
    const htmlPath = path.join(process.cwd(), 'client', 'public', 'simple-login.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Replace placeholder with real GOOGLE_CLIENT_ID
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    html = html.replace('YOUR_GOOGLE_CLIENT_ID', googleClientId);
    
    res.send(html);
  });

  app.get('/login', (req, res) => {
    // Same logic for /login route
    const htmlPath = path.join(process.cwd(), 'client', 'public', 'simple-login.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    html = html.replace('YOUR_GOOGLE_CLIENT_ID', googleClientId);
    
    res.send(html);
  });

  app.get('/dashboard', (req, res) => {
    res.send(`
      <html>
        <head><title>Dashboard</title></head>
        <body>
          <h1>Dashboard</h1>
          <p>Google OAuth успішно працює!</p>
          <script>
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            if (token && user) {
              document.body.innerHTML += '<p>Токен: ' + token.substring(0, 20) + '...</p>';
              document.body.innerHTML += '<p>Користувач: ' + user + '</p>';
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  });

  // Catch-all handler  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(process.cwd(), 'client', 'public', 'simple-login.html'));
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
  });
})();
