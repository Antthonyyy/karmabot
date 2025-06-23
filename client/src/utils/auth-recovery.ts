import { authUtils } from './auth';

export function checkAuthError(error: any): boolean {
  // Проверяем, является ли это ошибкой аутентификации
  if (error?.message?.includes('Invalid') || 
      error?.message?.includes('expired') ||
      error?.message?.includes('token') ||
      error?.status === 401 ||
      error?.status === 403) {
    return true;
  }
  return false;
}

export function handleAuthError() {
  console.log('🔄 Handling auth error - clearing local storage and redirecting to login');
  
  // Очищаем все данные авторизации
  authUtils.clearAuth();
  
  // Перенаправляем на страницу входа
  window.location.href = '/';
}