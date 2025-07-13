import { authUtils } from './auth';

export function checkAuthError(error: any): boolean {
  return error?.message?.includes('401') || 
         error?.message?.includes('Authentication') ||
         error?.message?.includes('Token expired');
}

export function handleAuthError() {
  console.warn('Authentication error detected, clearing auth data');
  authUtils.clearAuth();
  
  // Redirect to login page
  if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
    window.location.href = '/login';
  }
}

export function isNetworkError(error: any): boolean {
  return error?.message?.includes('Failed to fetch') ||
         error?.message?.includes('Network Error') ||
         error?.message?.includes('ERR_NETWORK');
}

export function handleNetworkError(error: any) {
  console.error('Network error:', error);
  
  // For network errors, we don't clear auth data immediately
  // Instead, we show a user-friendly message
  return {
    title: "Проблема з мережею",
    description: "Перевірте підключення до інтернету та спробуйте знову",
    retry: true
  };
}

// Утилита для автоматической обработки ошибок в fetch запросах
export function withAuthErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (checkAuthError(error)) {
        handleAuthError();
        throw new Error('Authentication required');
      }
      throw error;
    }
  }) as T;
}