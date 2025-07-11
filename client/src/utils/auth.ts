// Export individual functions for use in components
export const setToken = (token: string) => {
  console.log('Setting new auth token');
  localStorage.setItem('token', token);
};

export const setUser = (user: any) => {
  console.log('Updating user data');
  localStorage.setItem('user', JSON.stringify(user));
};

export const getToken = () => localStorage.getItem('token');

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

interface JWTPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: any;
}

export const authUtils = {
  getToken,
  setToken,
  getUser,
  setUser,

  getAuthHeaders: () => {
    const token = getToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      // Validate token before adding to headers
      if (authUtils.isAuthenticated()) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        console.warn('Token validation failed, headers will be sent without auth');
      }
    } else {
      console.warn('No auth token found');
    }
    
    return headers;
  },

  clearAuth: () => {
    console.log('Clearing auth data');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  decodeToken: (token: string): JWTPayload | null => {
    try {
      const [header, payload, signature] = token.split('.');
      
      if (!header || !payload || !signature) {
        console.error('Invalid token format - missing parts');
        return null;
      }

      const decodedPayload = JSON.parse(atob(payload));
      console.log('Token payload decoded:', {
        exp: decodedPayload.exp ? new Date(decodedPayload.exp * 1000) : 'none',
        iat: decodedPayload.iat ? new Date(decodedPayload.iat * 1000) : 'none',
        sub: decodedPayload.sub || 'none'
      });

      return decodedPayload;
    } catch (error) {
      console.error('Token decode failed:', error);
      return null;
    }
  },

  isAuthenticated: () => {
    const token = getToken();
    
    if (!token) {
      console.warn('Auth check failed: No token found');
      return false;
    }

    try {
      const payload = authUtils.decodeToken(token);
      
      if (!payload) {
        console.error('Auth check failed: Invalid token format');
        authUtils.clearAuth();
        return false;
      }

      if (!payload.exp) {
        console.error('Auth check failed: Token missing expiration');
        return false;
      }

      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;

      // Log expiration status
      if (timeUntilExpiry <= 0) {
        console.warn('Token expired:', {
          expiredAt: new Date(payload.exp * 1000),
          currentTime: new Date(),
          expiredAgo: Math.round(-timeUntilExpiry / 60) + ' minutes ago'
        });
        authUtils.clearAuth();
        return false;
      }

      // Warn if token is close to expiry
      if (timeUntilExpiry < 300) { // 5 minutes
        console.warn('Token expires soon:', {
          expiresIn: Math.round(timeUntilExpiry / 60) + ' minutes',
          expiresAt: new Date(payload.exp * 1000)
        });
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      authUtils.clearAuth();
      return false;
    }
  },
};