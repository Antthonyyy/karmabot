# Инструкция по деплою Karma Tracker

## Обязательные переменные окружения

```bash
JWT_SECRET=your-super-secret-jwt-key-here
DATABASE_URL=postgresql://username:password@host:port/database
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Опциональные переменные

```bash
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-app-domain.com
OPENAI_API_KEY=sk-your-openai-api-key
WAYFORPAY_MERCHANT=your-merchant-id
WAYFORPAY_SECRET=your-secret-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://your-app-domain.com
WEBHOOK_SECRET=your-webhook-secret
GOOGLE_CLIENT_SECRET=your-google-client-secret
SENTRY_DSN=your-sentry-dsn
```

## Команды для деплоя

```bash
# Сборка
npm run build

# Запуск
npm start

# Проверка здоровья
curl http://localhost:5000/api/health
```

## Платформы деплоя

### Render
- Build Command: `npm run build`
- Start Command: `npm start`
- Environment: Node.js

### Railway
- Build Command: `npm run build`
- Start Command: `npm start`

### Heroku
- Build Command: `npm run build`
- Start Command: `npm start`

## Проверка деплоя

1. Проверьте health endpoint: `https://your-domain.com/api/health`
2. Проверьте главную страницу: `https://your-domain.com`
3. Проверьте API: `https://your-domain.com/api/ai/status`

## Устранение проблем

- Если приложение не запускается, проверьте обязательные переменные окружения
- Если Google OAuth не работает, проверьте GOOGLE_CLIENT_ID и FRONTEND_URL
- Если база данных не подключается, проверьте DATABASE_URL 