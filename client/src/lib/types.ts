export interface User {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  currentPrinciple: number;
  notificationType: string;
  customTimes?: any;
  language: string;
  telegramConnected: boolean;
  telegramId?: string;
  timezoneOffset?: number;
  reminderMode?: string;
  dailyPrinciplesCount?: number;
  timezone?: string;
  remindersEnabled?: boolean;
  stats?: UserStats;
}

export interface UserStats {
  streakDays: number;
  totalEntries: number;
  currentCycle: number;
  principleProgress?: Record<string, number>;
}

export interface Principle {
  id: number;
  number: number;
  title: string;
  description: string;
  url?: string;
  reflections?: string[];
  practicalSteps?: string[];
}

export interface JournalEntry {
  id: number;
  userId: number;
  principleId: number;
  content: string;
  mood?: string;
  energyLevel?: number;
  createdAt: string;
  updatedAt: string;
  principle?: Principle;
}
