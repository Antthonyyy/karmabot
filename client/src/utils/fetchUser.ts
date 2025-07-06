
import { authUtils } from './auth';

export interface UserData {
  id: number;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  currentPrinciple: number;
  language: string;
  timezone: string;
  remindersEnabled: boolean;
  morningReminderTime?: string;
  eveningReminderTime?: string;
  hasCompletedOnboarding: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchUser(): Promise<UserData | null> {
  try {
    const token = authUtils.getToken();
    
    if (!token) {
      console.log('No token found, user not authenticated');
      return null;
    }

    const response = await fetch('/api/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (response.status === 401) {
      console.log('Token expired or invalid, clearing auth');
      authUtils.clearAuth();
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const userData = await response.json();
    
    // Update local storage with fresh user data
    authUtils.setUser(userData);
    
    return userData;
  } catch (error) {
    console.error('Error fetching user:', error);
    
    // On network error, return cached user if available
    const cachedUser = authUtils.getUser();
    if (cachedUser) {
      console.log('Using cached user data due to network error');
      return cachedUser;
    }
    
    return null;
  }
}

export async function refreshUserData(): Promise<UserData | null> {
  const userData = await fetchUser();
  return userData;
}
