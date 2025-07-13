import { authUtils } from '@/utils/auth';

export async function apiRequest(url: string, options: RequestInit = {}) {
  const token = authUtils.getToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      authUtils.clearAuth();
      window.location.href = '/login';
    }
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }
  
  return response.json();
} 