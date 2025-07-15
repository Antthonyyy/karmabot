# Karma Journal - Development Guide (Render)

## Overview

Karma Journal is a full-stack spiritual self-reflection app with daily journaling, reminders, and AI insights based on 10 karmic principles. Users receive regular reminders, reflect, and track their growth over time. Premium functionality is available via subscriptions.

Built with React (frontend), Express (backend), PostgreSQL (via Drizzle ORM), and hosted on Render.

## System Architecture

### Frontend
- **React 18 + TypeScript**
- **Routing**: Wouter
- **Styling**: Tailwind CSS + shadcn/ui + Radix UI
- **Build**: Vite
- **State Management**: TanStack Query
- **i18n**: i18next (Ukrainian/English)

### Backend
- **Node.js + TypeScript**
- **Framework**: Express.js
- **Database**: PostgreSQL (Drizzle ORM)
- **Authentication**: Google OAuth + Telegram Login, JWT
- **AI**: OpenAI API
- **Payments**: WayForPay
- **Bot**: Telegram Bot API

## Key Features

### Auth
- Google OAuth and Telegram Login support
- JWT token management via localStorage
- `needsSubscription` flag determines access after login
- Auth flow redirects: `/subscriptions` → `/onboarding` → `/dashboard`

### Journal & Progress
- Daily entries tied to karmic principles (1–10)
- Mood & energy logging
- Progress analytics, streaks, achievements

### AI
- Daily karma-based insights
- AI Advisor gives feedback on entries
- AI chat available for Pro users

### Subscription System
- Free plan + 3 paid tiers: Light, Plus, Pro
- Free trial: 3 days full access
- WayForPay integration with webhook updates
- Server sets `needsSubscription` on first login automatically

### Notifications
- Telegram Bot (3x/day reminders)
- Web Push Notifications (fallback + synced)

## Data Flow

### Onboarding
1. User logs in via Google or Telegram
2. Backend checks `needsSubscription`
3. If true → redirect to `/subscriptions`
4. After payment → user lands on `/onboarding`
5. Final destination → `/dashboard`

### Daily Flow
1. User gets Telegram/Web Push reminder
2. Opens app
3. Sees active principle
4. Journals reflection
5. Receives AI insight

### Karma Principle Loop
1. Entry logs tied to current principle
2. Progress monitored
3. User can switch to next principle manually

## Deployment: Render

### General Flow
1. Push changes to GitHub
2. Render pulls and builds app
3. App runs at `https://karma-traker.onrender.com`

### Render Details
- **Monorepo**: frontend + backend served from one service
- **Build command**: `npm run build`
- **Start command**: `npm run start`
- **Node.js 20**, PostgreSQL, Render Web Service

### Required Environment Variables
```
DATABASE_URL=...
JWT_SECRET=...
TELEGRAM_BOT_TOKEN=...
OPENAI_API_KEY=...
WAYFORPAY_MERCHANT=...
WAYFORPAY_SECRET=...
FRONTEND_URL=https://karma-traker.onrender.com
```

## External Services
- Supabase (Postgres hosting)
- Telegram Bot API
- OpenAI API (insights, AI advisor)
- WayForPay (subscription payments)

## Known Issues / Fixes
- ❗Login error: server returned HTML instead of JSON — fixed by correcting Express route fallback logic (don't serve HTML for `/api/*`)
- ❗Agent override: broke API handler — fixed manually, no catch-all override for `/api`

## Changelog
(unchanged — full dev log retained)

## Summary
Production-ready stack. Auth via Google or Telegram → pay → onboard → dashboard. Telegram & Web Push reminders working. AI insights active. Hosted on Render, GitHub-based deployment. Everything modular and extensible.
