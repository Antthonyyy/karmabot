export interface User {
  id: number;
  telegramId?: string;
  telegramChatId?: string;
  firstName: string;
  lastName?: string;
  username?: string;
  currentPrinciple: number;
  timezoneOffset: number;
  notificationType: 'daily' | 'custom';
  customTimes?: any;
  language: string;
  isActive: boolean;
  reminderMode: string;
  dailyPrinciplesCount: number;
  timezone: string;
  remindersEnabled: boolean;
  lastReminderSent?: string;
  hasCompletedOnboarding: boolean;
  subscription: 'none' | 'light' | 'plus' | 'pro';
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  stats?: {
    streakDays: number;
    totalKarma: number;
    entriesCount: number;
  };
}

export interface UserFlowState {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  hasActiveSubscription: boolean;
  nextStep: 'login' | 'onboarding' | 'subscription' | 'dashboard';
}

export interface AuthResponse {
  token: string;
  user: User;
  isNewUser: boolean;
  needsSubscription: boolean;
}

export interface Subscription {
  plan: string;
  startDate: string | null;
  endDate: string | null;
  features: any;
}

export interface JournalEntry {
  id: number;
  userId: number;
  content: string;
  principleId: number;
  karmaPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface Principle {
  id: number;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  condition: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}
