# Karma Journal - Replit Development Guide

## Overview

Karma Journal is a full-stack web application designed to help users develop positive karma through daily journaling and spiritual practice. The application follows the principles of karma development through structured reflection and habit formation.

The app is built as a monorepo with a Node.js/Express backend, React frontend with TypeScript, and PostgreSQL database using Drizzle ORM. It integrates with Telegram for user authentication and notifications, features AI-powered insights using OpenAI, and includes a subscription system for premium features.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds
- **UI Components**: Radix UI primitives with custom styling
- **Internationalization**: i18next for Ukrainian and English support

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with RESTful API design
- **Authentication**: JWT tokens with Telegram OAuth integration
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Telegram Bot API for notifications and reminders
- **AI Integration**: OpenAI API for personalized insights and chat
- **Payment Processing**: WayForPay for subscription handling

## Key Components

### Authentication System
- **Telegram Integration**: Users authenticate via Telegram Login Widget
- **Session Management**: JWT tokens stored in localStorage with automatic refresh
- **Authorization Middleware**: Route protection based on user authentication status
- **User Logout**: Standard logout functionality integrated in navigation

### Journal System
- **Daily Entries**: Users create journal entries linked to karma principles
- **Principle Progression**: Sequential advancement through 10 karma principles
- **Mood & Energy Tracking**: Optional mood and energy level recording
- **Quick Add**: Streamlined entry creation with predefined categories

### AI Features
- **Daily Insights**: Personalized daily guidance based on current principle
- **AI Advisor**: Analysis of user entries with personalized recommendations
- **AI Chat**: Interactive conversation with karma consultant (Pro plan)
- **Budget Monitoring**: AI usage tracking with cost management

### Subscription System
- **Tiered Plans**: Free, Light (€5/€50), Plus (€10/€100), Pro (€20/€200)
- **Feature Gating**: AI features, analytics, and exports based on plan
- **Payment Integration**: WayForPay for European market focus
- **Usage Tracking**: AI request limits and budget monitoring

### Analytics & Progress
- **Streak Tracking**: Daily journaling streak measurement
- **Principle Progress**: Track completion rate across all principles
- **Mood Analytics**: Trend analysis of mood and energy patterns
- **Achievement System**: Gamification with unlockable badges

## Data Flow

### User Onboarding
1. User authenticates via Telegram
2. Profile creation with basic information
3. Reminder preference configuration
4. Initial principle assignment (Principle 1)

### Daily Usage Pattern
1. User receives Telegram reminder notification
2. Opens app and views current principle
3. Creates journal entry with reflection
4. Views AI-generated daily insight
5. Tracks progress and analytics

### Principle Progression
1. User completes entries for current principle
2. System tracks completion rate and engagement
3. Manual progression to next principle
4. Cycle repeats through all 10 principles

## External Dependencies

### Required Services
- **PostgreSQL Database**: Primary data storage (Neon serverless recommended)
- **Telegram Bot API**: User authentication and notifications
- **OpenAI API**: AI insights, advice, and chat functionality
- **WayForPay**: Payment processing for subscriptions

### Environment Variables
```
DATABASE_URL=postgresql://...
TELEGRAM_BOT_TOKEN=your_bot_token
OPENAI_API_KEY=your_openai_key
WAYFORPAY_MERCHANT=merchant_id
WAYFORPAY_SECRET=merchant_secret
JWT_SECRET=secure_jwt_secret
FRONTEND_URL=https://your-domain.com
```

### Development Dependencies
- Node.js 20+
- TypeScript for type safety
- Drizzle Kit for database migrations
- Vite for frontend development
- Various React ecosystem packages

## Deployment Strategy

### Replit Configuration
- **Runtime**: Node.js 20 with PostgreSQL 16
- **Development**: `npm run dev` starts both frontend and backend
- **Production Build**: `npm run build` creates optimized production bundle
- **Auto-scaling**: Configured for automatic scaling based on demand

### Database Setup
- Drizzle ORM with PostgreSQL dialect
- Migrations managed through `drizzle.config.ts`
- Schema defined in shared TypeScript files
- Automatic connection testing on startup

### Environment Management
- Development and production environment separation
- Comprehensive environment variable validation
- Fallback configurations for development

## Changelog

```
Changelog:
- June 27, 2025. Upgraded OpenAI model from gpt-3.5-turbo to gpt-4o for better psychological coaching capabilities
- June 27, 2025. Removed complex ThemeProvider architecture and implemented self-contained SafeThemeToggle
- June 27, 2025. Added page transition animations using framer-motion with staggered card animations
- June 23, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```