# Настройка деплоя на Render.com

## 1. Создание нового Web Service

1. Зайдите на [render.com](https://render.com)
2. Нажмите "New +" → "Web Service"
3. Подключите ваш GitHub репозиторий
4. Выберите репозиторий `karmabot`

## 2. Настройка Build & Deploy

### Build Command:
```bash
npm run build
```

### Start Command:
```bash
npm start
```

### Environment:
- **Runtime**: Node
- **Region**: Frankfurt (EU Central) или ближайший к вам

## 3. Обязательные переменные окружения

В разделе "Environment Variables" добавьте:

### Обязательные:
```
JWT_SECRET=your-super-secret-jwt-key-here
DATABASE_URL=postgresql://username:password@host:port/database
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Опциональные:
```
NODE_ENV=production
FRONTEND_URL=https://your-app-name.onrender.com
OPENAI_API_KEY=sk-your-openai-api-key
WAYFORPAY_MERCHANT=your-merchant-id
WAYFORPAY_SECRET=your-secret-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://your-app-name.onrender.com
WEBHOOK_SECRET=your-webhook-secret
GOOGLE_CLIENT_SECRET=your-google-client-secret
SENTRY_DSN=your-sentry-dsn
```

## 4. Настройка базы данных

### Вариант 1: Render PostgreSQL
1. Создайте новый PostgreSQL сервис на Render
2. Скопируйте Internal Database URL
3. Добавьте как `DATABASE_URL`

### Вариант 2: Supabase
1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте Connection String
3. Добавьте как `DATABASE_URL`

## 5. Настройка Google OAuth

1. Зайдите в [Google Cloud Console](https://console.cloud.google.com)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 credentials
5. Добавьте авторизованные домены:
   - `your-app-name.onrender.com`
   - `localhost:3000` (для разработки)
6. Скопируйте Client ID и добавьте как `GOOGLE_CLIENT_ID`

## 6. Проверка деплоя

После деплоя проверьте:

1. **Health Check**: `https://your-app-name.onrender.com/api/health`
2. **Главная страница**: `https://your-app-name.onrender.com`
3. **Логи**: В разделе "Logs" на Render

## 7. Возможные проблемы

### Ошибка "Build failed"
- Проверьте, что все зависимости установлены
- Убедитесь, что Node.js версия 20.16.11

### Ошибка "Application error"
- Проверьте переменные окружения
- Посмотрите логи в разделе "Logs"

### Google OAuth не работает
- Проверьте `GOOGLE_CLIENT_ID`
- Убедитесь, что домен добавлен в Google Console
- Проверьте `FRONTEND_URL`

### База данных не подключается
- Проверьте `DATABASE_URL`
- Убедитесь, что база данных доступна извне
- Проверьте права доступа

## 8. Автоматический деплой

После настройки:
- Каждый push в `main` ветку автоматически запустит новый деплой
- Render будет использовать `render.yaml` для конфигурации
- Health check будет проверять работоспособность приложения 