const TOKEN_KEY = 'karma_token';
const USER_KEY = 'karma_user';

export const authUtils = {
  // Токен
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  
  // Пользователь
  getUser: () => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  setUser: (user: any) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),
  
  // Очистка всех данных
  clearAuth: () => {
    authUtils.removeToken();
    authUtils.removeUser();
  },
  
  // Проверка авторизации
  isAuthenticated: () => !!authUtils.getToken(),
  
  // Заголовки для запросов
  getAuthHeaders: () => ({
    'Authorization': `Bearer ${authUtils.getToken()}`,
    'Content-Type': 'application/json'
  })
};