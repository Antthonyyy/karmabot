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
- July 7, 2025. ✅ GOOGLE OAUTH IMPLEMENTED: Completed frontend Google OAuth integration with GoogleLoginButton, GoogleOAuthProvider, and LoginPage components
- July 7, 2025. Added Google OAuth API endpoint /api/auth/google and updated authentication flow to support both Telegram and Google login
- July 7, 2025. Created ProtectedRoute component and updated App.tsx routing to redirect unauthenticated users to /login
- July 7, 2025. Fixed server startup issues by temporarily disabling Vite development server while maintaining Express backend functionality
- July 7, 2025. Updated authentication utilities and queryClient to support Google OAuth token management
- July 3, 2025. ✅ CLEANED UP: Removed raw SQL workarounds and restored proper Drizzle select queries with explicit column mapping
- July 3, 2025. ✅ MIGRATION ORGANIZED: Moved migration file to migrations/ directory and verified schema synchronization
- July 3, 2025. ✅ TESTS ADDED: Created Jest test suite for subscription middleware plan hierarchy validation (all tests passing)
- July 3, 2025. Implemented complete 3-day free trial system with automatic trial creation for new users
- July 3, 2025. Added subscription middleware with plan hierarchy (trial has access to all features)
- July 3, 2025. Updated subscription schema with startedAt, expiresAt fields and trial plan support
- July 3, 2025. Enhanced SubscriptionRequired component to show trial countdown and upgrade prompts
- July 3, 2025. Added trial countdown toast notifications to dashboard for users with <3 days remaining
- July 3, 2025. ✅ MIGRATION COMPLETE: Created proper Drizzle migration 20250703_add_trial_columns.sql with started_at, expires_at columns, indexes, and trial defaults. Schema synchronized with database.
- July 2, 2025. Completed real Web Push notification system with VAPID-based push service integrated into reminderService
- July 2, 2025. Removed all test functionality from push notification system for production readiness
- July 2, 2025. Push notifications now work parallel to Telegram notifications with title "Час для рефлексії 🪷" and principle text
- July 2, 2025. Integrated push notifications into all scheduled reminders: morning, afternoon, and evening
- July 2, 2025. Successfully converted Telegram bot from polling to webhook mode to eliminate 409 conflicts
- July 2, 2025. Added environment variables for webhook configuration: BOT_MODE, TELEGRAM_WEBHOOK_URL, WEBHOOK_SECRET
- July 2, 2025. Created webhook endpoint at /api/telegram/webhook with proper authentication
- July 2, 2025. Fixed TypeScript errors in WelcomeHero, StreakCard, and OnboardingModal components
- July 2, 2025. Implemented bot mode switching for development (off) and production (webhook) environments
- June 30, 2025. Successfully implemented clean dashboard layout according to user specifications with simple card-based design
- June 30, 2025. Removed complex sidebar navigation and tabs for minimalist approach
- June 30, 2025. Created responsive grid layout with StreakCard and NextPrincipleCard in top row
- June 30, 2025. Fixed component prop dependencies and import issues for better modularity
- June 30, 2025. Integrated TodaysPlan and LatestEntries components for clean information hierarchy
- June 30, 2025. Enhanced voice recording with multi-language support for Ukrainian, Russian, and English through OpenAI Whisper API
- June 30, 2025. Updated audio transcription endpoint to detect user language preferences from profile and i18next settings
- June 30, 2025. Improved VoiceRecorder component with better browser compatibility detection and error handling
- June 30, 2025. Successfully completed Web Push notification system integration with full API implementation and frontend components
- June 30, 2025. Fixed routes.ts syntax errors and properly positioned push notification endpoints within registerRoutes function
- June 30, 2025. Added complete Web Push API with four endpoints: subscribe, unsubscribe, test, and get subscriptions
- June 30, 2025. Created PushNotificationSettings component with permission management, subscription status, and test functionality
- June 30, 2025. Enhanced service worker with push event handlers and notification display capabilities
- June 30, 2025. Integrated Web Push settings into main SettingsPage alongside Telegram notifications for dual notification support
- June 30, 2025. Completed comprehensive PWA setup with PNG and SVG icons for maximum browser compatibility
- June 30, 2025. Created intelligent PWA install prompt component with iOS-specific instructions and session management
- June 30, 2025. Updated HTML meta tags and manifest.json for optimal PWA installation experience across all devices
- June 30, 2025. Generated fallback PNG icons (192x192, 512x512, apple-touch-icon) for browsers that don't support SVG
- June 30, 2025. Integrated PWA install prompt into main App component for automatic installation prompts
- June 30, 2025. Completely redesigned dashboard with mobile-first approach and modern glass morphism aesthetic
- June 30, 2025. Implemented responsive navigation tabs with icon-based mobile layout and gradient active states
- June 30, 2025. Added comprehensive statistics cards grid showing streak, entries, principle progress, and weekly goals
- June 30, 2025. Created adaptive layout with main content area and sidebar for quick actions and principle overview
- June 30, 2025. Integrated glass morphism effects with backdrop blur, gradient backgrounds, and floating decorative elements
- June 30, 2025. Enhanced user experience with intuitive mobile-responsive design patterns and improved accessibility
- June 30, 2025. Enhanced dashboard with glass morphism design, animated background elements, and gradient card styling
- June 30, 2025. Added decorative floating gradient orbs with pulsing animations for immersive visual experience
- June 30, 2025. Implemented gradient text headers and enhanced card layouts with backdrop blur effects
- June 30, 2025. Created additional sidebar card with daily goal tracking and activity status indicators
- June 30, 2025. Implemented complete Progressive Web App (PWA) functionality with manifest.json, service worker, and offline support
- June 30, 2025. Created comprehensive PWA icons in SVG format (192x192, 512x512, Apple touch icon) using animated lotus design
- June 30, 2025. Added advanced service worker with cache-first strategy for static assets and network-first for API requests
- June 30, 2025. Integrated PWA install prompts and update notifications in main application
- June 30, 2025. Moved theme toggle from main navigation to dedicated settings page for improved UX
- June 30, 2025. Redesigned main logo to animated lotus flower with multi-layered petals, rotation animations, and energy particles
- June 30, 2025. Added "Antidote" category to journal quick add feature with 2x2 grid layout (kindness, gratitude, help, antidote)
- June 30, 2025. Implemented antidote reminder system in Telegram bot with time-specific prompts 30 minutes before main reminders
- June 30, 2025. Updated favicon to match new lotus logo design for consistent branding
- June 30, 2025. Switched from temporary Replit PostgreSQL to Supabase database for production use
- June 30, 2025. Fixed database connection issues by cleaning malformed DATABASE_URL environment variable
- June 27, 2025. Upgraded OpenAI model from gpt-3.5-turbo to gpt-4o for better psychological coaching capabilities
- June 27, 2025. Removed complex ThemeProvider architecture and implemented self-contained SafeThemeToggle
- June 27, 2025. Added page transition animations using framer-motion with staggered card animations
- June 23, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```