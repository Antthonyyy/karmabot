# 📁 Детальна структура проєкту Karma Journal

## 🏗️ Архітектура проєкту
Це fullstack додаток з монорепо структурою, що складається з фронтенду (React), бекенду (Node.js/Express) та спільної схеми бази даних.

```
karma-journal/
├── 📂 client/                          # 🎨 Frontend (React + TypeScript + Vite)
├── 📂 server/                          # ⚙️ Backend (Node.js + Express + TypeScript)
├── 📂 shared/                          # 🔗 Спільні типи та схема БД
├── 📂 attached_assets/                 # 📎 Прикріплені файли та зображення
├── 📂 node_modules/                    # 📦 Залежності npm
└── 🔧 Конфігураційні файли
```

## 📂 CLIENT (Frontend)

### 🎯 Основна структура
```
client/
├── index.html                          # 🏠 Головний HTML файл
└── src/
    ├── main.tsx                        # 🚀 Точка входу React App
    ├── App.tsx                         # 📋 Головний компонент з роутингом
    ├── index.css                       # 🎨 Головні стилі Tailwind CSS
    │
    ├── 📂 components/                  # 🧩 React компоненти
    ├── 📂 pages/                       # 📄 Сторінки додатку
    ├── 📂 hooks/                       # 🪝 Кастомні React хуки
    ├── 📂 utils/                       # 🛠️ Утиліти та допоміжні функції
    ├── 📂 lib/                         # 📚 Бібліотеки та конфігурації
    ├── 📂 i18n/                        # 🌍 Інтернаціоналізація (i18next)
    └── 📂 locales/                     # 🗣️ Переклади
```

### 🧩 Компоненти (client/src/components/)
```
components/
├── 🎯 Основні компоненти:
│   ├── BackButton.tsx                  # ← Кнопка "Назад"
│   ├── PageTransition.tsx              # 🔄 Анімації переходів між сторінками
│   ├── SafeThemeToggle.tsx             # 🌓 Перемикач теми (світла/темна)
│   ├── LanguageSwitcher.tsx            # 🌍 Перемикач мови (УК/EN)
│   └── TelegramLoginButton.tsx         # 📱 Кнопка входу через Telegram
│
├── 📊 Dashboard компоненти:
│   ├── TodaysPlan.tsx                  # 📅 План на сьогодні
│   ├── KarmaStats.tsx                  # 📈 Статистика карми
│   ├── AIDailyInsight.tsx              # 🤖 Щоденні AI інсайти
│   ├── ProgressChart.tsx               # 📊 Графіки прогресу
│   ├── PrincipleCard.tsx               # 📋 Картка принципу
│   ├── NextPrincipleCard.tsx           # ➡️ Наступний принцип
│   └── AIBudgetStatus.tsx              # 💰 Статус AI бюджету
│
├── 📝 Журнал та форми:
│   ├── DiaryForm.tsx                   # ✍️ Форма щоденника
│   ├── JournalQuickAdd.tsx             # ⚡ Швидке додавання запису
│   └── OnboardingModal.tsx             # 👋 Модальне вікно онбордингу
│
├── ⚙️ Налаштування:
│   ├── SettingsPanel.tsx               # 🛠️ Панель налаштувань
│   ├── ReminderModeSelector.tsx        # ⏰ Вибір режиму нагадувань
│   └── CustomScheduleEditor.tsx        # 📋 Редактор розкладу
│
├── 🤖 AI функції:
│   └── AIChat.tsx                      # 💬 AI чат консультант
│
├── 📊 Аналітика:
│   ├── AnalyticsPanel.tsx              # 📈 Панель аналітики
│   └── Achievements.tsx                # 🏆 Досягнення
│
├── 💎 Підписки:
│   └── SubscriptionRequired.tsx        # 🔒 Вимога підписки
│
└── 📂 ui/                             # 🎨 UI компоненти (shadcn/ui)
    ├── accordion.tsx                   # 🪗 Акордеон
    ├── alert-dialog.tsx                # ⚠️ Діалог попередження
    ├── alert.tsx                       # 📢 Алерт
    ├── avatar.tsx                      # 👤 Аватар
    ├── badge.tsx                       # 🏷️ Бейдж
    ├── button.tsx                      # 🔘 Кнопка
    ├── calendar.tsx                    # 📅 Календар
    ├── card.tsx                        # 🃏 Картка
    ├── checkbox.tsx                    # ☑️ Чекбокс
    ├── command.tsx                     # ⌨️ Командний інтерфейс
    ├── dialog.tsx                      # 💬 Діалог
    ├── dropdown-menu.tsx               # 📋 Випадаюче меню
    ├── form.tsx                        # 📝 Форма
    ├── input.tsx                       # ✏️ Поле вводу
    ├── label.tsx                       # 🏷️ Лейбл
    ├── popover.tsx                     # 💭 Спливаюче вікно
    ├── progress.tsx                    # 📊 Прогрес бар
    ├── radio-group.tsx                 # 🔘 Радіо група
    ├── scroll-area.tsx                 # 📜 Область скролу
    ├── select.tsx                      # 📋 Селект
    ├── separator.tsx                   # ➖ Розділювач
    ├── sheet.tsx                       # 📄 Бічна панель
    ├── skeleton.tsx                    # 💀 Скелетон загрузки
    ├── slider.tsx                      # 🎚️ Слайдер
    ├── switch.tsx                      # 🔄 Перемикач
    ├── tabs.tsx                        # 📑 Вкладки
    ├── textarea.tsx                    # 📝 Область тексту
    ├── toast.tsx                       # 🍞 Тост уведомления
    ├── toaster.tsx                     # 🎯 Тостер
    └── tooltip.tsx                     # 💡 Підказка
```

### 📄 Сторінки (client/src/pages/)
```
pages/
├── HomePage.tsx                        # 🏠 Головна сторінка (посадочна)
├── DashboardPage.tsx                   # 📊 Дашборд (основна робоча сторінка)
├── AnalyticsPage.tsx                   # 📈 Сторінка аналітики
├── SettingsPage.tsx                    # ⚙️ Сторінка налаштувань
├── SubscriptionsPage.tsx               # 💎 Сторінка підписок
├── OnboardingPage.tsx                  # 👋 Сторінка онбордингу
└── not-found.tsx                       # 🔍 Сторінка 404
```

### 🪝 Хуки (client/src/hooks/)
```
hooks/
├── useAuth.ts                          # 🔐 Хук автентифікації
├── useOnboarding.ts                    # 👋 Хук онбордингу
├── use-toast.ts                        # 🍞 Хук для тостів
└── use-mobile.tsx                      # 📱 Хук для мобільної версії
```

### 🛠️ Утиліти (client/src/utils/)
```
utils/
├── auth.ts                             # 🔐 Утиліти автентифікації
└── auth-recovery.ts                    # 🔄 Відновлення автентифікації
```

### 📚 Бібліотеки (client/src/lib/)
```
lib/
├── queryClient.ts                      # 📡 Конфігурація TanStack Query
├── types.ts                            # 📝 TypeScript типи
└── utils.ts                            # 🛠️ Допоміжні утиліти
```

### 🌍 Інтернаціоналізація
```
i18n/
├── config.ts                           # ⚙️ Конфігурація i18next
└── locales/
    ├── en/                             # 🇺🇸 Англійські переклади
    │   ├── ai.json
    │   └── dashboard.json
    └── uk/                             # 🇺🇦 Українські переклади
        ├── achievements.json
        ├── ai.json
        ├── dashboard.json
        ├── journal.json
        └── stats.json

locales/                                # 📂 Основні переклади
├── en/                                 # 🇺🇸 English
│   ├── achievements.json
│   ├── ai.json
│   ├── common.json
│   └── subscriptions.json
└── uk/                                 # 🇺🇦 Українська
    ├── achievements.json
    ├── ai.json
    ├── common.json
    └── subscriptions.json
```

## 📂 SERVER (Backend)

### ⚙️ Основна структура
```
server/
├── index.ts                            # 🚀 Точка входу сервера
├── routes.ts                           # 🛣️ Основні маршрути API
├── db.ts                               # 🗄️ Підключення до БД (Drizzle)
├── storage.ts                          # 💾 Інтерфейс зберігання даних
├── auth.ts                             # 🔐 Автентифікація JWT
├── auth-sessions.ts                    # 🎫 Сесії автентифікації
├── telegram-bot.ts                     # 🤖 Telegram бот
├── vite.ts                             # ⚡ Vite інтеграція
│
├── 📂 routes/                          # 🛣️ API маршрути
├── 📂 services/                        # 🔧 Бізнес-логіка сервісів
├── 📂 middleware/                      # 🔀 Проміжне ПЗ
├── 📂 bot/                             # 🤖 Telegram бот логіка
├── 📂 config/                          # ⚙️ Конфігурації
├── 📂 db/                              # 🗄️ База даних
└── 📂 utils/                           # 🛠️ Утиліти сервера
```

### 🛣️ API Маршрути (server/routes/)
```
routes/
└── ai.ts                               # 🤖 AI маршрути (OpenAI інтеграція)
```

### 🔧 Сервіси (server/services/)
```
services/
├── ai-assistant.ts                     # 🤖 AI асистент (GPT-4o)
├── aiService.ts                        # 🧠 AI сервіс
├── aiCacheService.ts                   # 💾 Кешування AI відповідей
├── budgetMonitor.ts                    # 💰 Моніторинг AI бюджету
├── achievementService.ts               # 🏆 Система досягнень
├── reminderService.ts                  # ⏰ Сервіс нагадувань
├── subscriptionService.ts              # 💎 Сервіс підписок (WayForPay)
└── telegramService.ts                  # 📱 Telegram API сервіс
```

### 🔀 Middleware (server/middleware/)
```
middleware/
└── subscription.ts                     # 💎 Перевірка підписки
```

### 🤖 Telegram Bot (server/bot/)
```
bot/
└── index.ts                            # 🤖 Telegram бот логіка
```

### ⚙️ Конфігурації (server/config/)
```
config/
└── reminderModes.ts                    # ⏰ Режими нагадувань
```

### 🗄️ База даних (server/db/)
```
db/
├── migrate.ts                          # 🔄 Міграції БД
└── migrations/                         # 📁 Файли міграцій
    ├── add_subscription_fields.ts      # 💎 Додавання полів підписки
    └── create_new_tables.ts            # 📋 Створення нових таблиць
```

### 🛠️ Утиліти (server/utils/)
```
utils/
└── env-check.ts                        # 🔍 Перевірка змінних середовища
```

## 📂 SHARED (Спільні ресурси)

```
shared/
└── schema.ts                           # 🗄️ Схема БД (Drizzle ORM + Zod)
```

### 📊 Структура бази даних
```sql
📋 Основні таблиці:
├── users                               # 👥 Користувачі
├── principles                          # 📜 10 принципів карми
├── journal_entries                     # 📝 Записи щоденника
├── user_stats                          # 📊 Статистика користувачів
├── daily_stats                         # 📅 Щоденна статистика
├── weekly_stats                        # 📊 Тижнева статистика
├── reminder_schedules                  # ⏰ Розклад нагадувань
├── user_principles                     # 🔗 Зв'язок користувач-принцип
├── principle_history                   # 📈 Історія принципів
├── ai_insights                         # 🤖 AI інсайти
├── subscriptions                       # 💎 Підписки
├── ai_requests                         # 🧠 AI запити (лімітування)
├── ai_cache                            # 💾 Кеш AI відповідей
└── achievements                        # 🏆 Досягнення
```

## 📂 КОНФІГУРАЦІЙНІ ФАЙЛИ

```
📋 Корінь проєкту:
├── package.json                        # 📦 npm залежності та скрипти
├── package-lock.json                   # 🔒 Заблокировані версії
├── tsconfig.json                       # 🔧 TypeScript конфігурація
├── vite.config.ts                      # ⚡ Vite конфігурація
├── tailwind.config.ts                  # 🎨 Tailwind CSS конфігурація
├── postcss.config.js                   # 📄 PostCSS конфігурація
├── drizzle.config.ts                   # 🗄️ Drizzle ORM конфігурація
├── components.json                     # 🧩 shadcn/ui конфігурація
├── replit.md                           # 📖 Документація проєкту
└── .env.example                        # 🔐 Приклад змінних середовища
```

## 🚀 КОМАНДИ ЗАПУСКУ

```bash
# 🔥 Розробка (запуск dev сервера)
npm run dev

# 🏗️ Збірка продакшн версії
npm run build

# 🗄️ Міграції БД
npm run db:push

# 📊 Генерація схеми БД
npm run db:generate

# 🔍 Drizzle Studio (веб інтерфейс БД)
npm run db:studio
```

## 🔧 ТЕХНОЛОГІЇ ТА БІБЛІОТЕКИ

### 🎨 Frontend
- **React 18** - UI фреймворк
- **TypeScript** - Типізація
- **Vite** - Збірка та розробка
- **Tailwind CSS** - Стилізація
- **shadcn/ui** - UI компоненти
- **Framer Motion** - Анімації
- **TanStack Query** - Стан сервера
- **Wouter** - Роутинг
- **i18next** - Інтернаціоналізація
- **Lucide React** - Іконки

### ⚙️ Backend
- **Node.js 20** - Runtime
- **Express.js** - Веб фреймворк
- **TypeScript** - Типізація
- **Drizzle ORM** - ORM для БД
- **PostgreSQL** - База даних
- **JWT** - Автентифікація
- **OpenAI API** - AI функції (GPT-4o)
- **Telegram Bot API** - Інтеграція з Telegram
- **WayForPay** - Платіжна система
- **Zod** - Валідація схем

### 🛠️ DevOps та утиліти
- **ESLint** - Лінтинг
- **Prettier** - Форматування коду
- **Replit** - Хостинг та розробка

## 🎯 КЛЮЧОВІ ОСОБЛИВОСТІ

### 🌟 Функціональність
- ✅ **10 принципів карми** - Структурований розвиток
- ✅ **AI помічник** - Персональні поради та інсайти
- ✅ **Telegram інтеграція** - Нагадування та автентифікація
- ✅ **Підписки** - Freemium модель з WayForPay
- ✅ **Аналітика** - Детальна статистика прогресу
- ✅ **Мультимовність** - Українська та англійська
- ✅ **Responsive дизайн** - Підтримка всіх пристроїв
- ✅ **Темна/світла тема** - Автоматичне перемикання
- ✅ **PWA готовність** - Можна встановити як додаток

### 🔒 Безпека
- JWT автентифікація
- Telegram OAuth
- Валідація даних (Zod)
- Rate limiting для AI запитів
- Безпечне зберігання паролів

### 📈 Масштабованість
- Модульна архітектура
- Кешування AI відповідей
- Оптимізовані запити до БД
- CDN готовність
- Горизонтальне масштабування

Ця структура забезпечує чистий, масштабований та легкий у підтримці код для вашого проєкту розвитку карми! 🌟