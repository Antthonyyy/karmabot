# 🗃️ Очистка конфигурации базы данных

## Проблема

В проекте была путаница с подключениями к базе данных:
- В `.env` были переменные и для Supabase (`DATABASE_URL`) и для NeonDB (`PGHOST`, `PGDATABASE`, `PGUSER`)
- В коде была захардкожена строка подключения к Supabase, игнорируя `DATABASE_URL`
- Ненужные переменные засоряли конфигурацию

## Решение

### 1. Исправлено в коде

**`server/db.ts`**:
```typescript
// ❌ БЫЛО (захардкожено):
const supabaseUrl = 'postgresql://postgres.babyubgvqronpuezmmrb:...';
const databaseUrl = supabaseUrl;

// ✅ СТАЛО (используется .env):
const databaseUrl = process.env.DATABASE_URL;
```

### 2. Очищен .env файл

**Удалены ненужные переменные**:
- `PGHOST` - не используется в коде
- `PGDATABASE` - не используется в коде  
- `PGUSER` - не используется в коде
- `PGPASSWORD` - не используется в коде

**Оставлены только рабочие переменные**:
- `DATABASE_URL` - теперь реально используется для подключения
- `OPENAI_API_KEY` - для ИИ сервисов
- `TELEGRAM_BOT_TOKEN` - для Telegram бота
- `GOOGLE_CLIENT_ID` - для Google OAuth
- `WAYFORPAY_MERCHANT`, `WAYFORPAY_SECRET` - для платежей
- `FRONTEND_URL`, `JWT_SECRET` - основные настройки

### 3. Архитектура подключений

Проект использует **только Supabase PostgreSQL** через два клиента:

1. **Drizzle ORM** (`server/db.ts`) - основная работа с данными
   ```typescript
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   export const db = drizzle(pool, { schema });
   ```

2. **Supabase Client** (`server/supabase.ts`) - для Storage/Auth
   ```typescript
   export const supabase = createClient(supabaseUrl, password);
   ```

## Результат

✅ **Единая база данных**: только Supabase  
✅ **Чистая конфигурация**: удален мусор из `.env`  
✅ **Централизованное управление**: используется `DATABASE_URL`  
✅ **Прозрачность**: код соответствует конфигурации  

## Миграция

Если нужно сменить базу данных, просто обновите `DATABASE_URL` в `.env` - никаких изменений в коде не потребуется. 