// Export individual functions for use in components
export const setToken = (token: string) => localStorage.setItem('token', token);
export const setUser = (user: any) => localStorage.setItem('user', JSON.stringify(user));
export const getToken = () => localStorage.getItem('token');
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const authUtils = {
  getToken,
  setToken,
  getUser,
  setUser,
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;

      if (payload.exp && payload.exp < currentTime) {
        // Token expired, clear auth
        authUtils.clearAuth();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking token:', error);
      return false;
    }
  },
};