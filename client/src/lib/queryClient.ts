import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { authUtils } from '@/utils/auth';
import { checkAuthError, handleAuthError, isNetworkError, handleNetworkError } from '@/utils/auth-recovery';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Функция для получения заголовков с токеном
function getAuthHeaders(additionalHeaders?: HeadersInit): HeadersInit {
  const headers = {
    ...authUtils.getAuthHeaders(),
    ...additionalHeaders
  };

  return headers;
}

export async function apiRequest(
  url: string,
  options: RequestInit = {},
) {
  const requestOptions: RequestInit = { 
    method: options.method || 'GET',
    headers: {
      ...getAuthHeaders(options.headers),
      // Automatically add Content-Type for POST/PUT/PATCH with body
      ...(options.body && ['POST', 'PUT', 'PATCH'].includes(options.method || 'GET') 
        ? { 'Content-Type': 'application/json' } 
        : {}),
    },
    credentials: 'include',
    ...options
  };

  try {
    const res = await fetch(url, requestOptions);
    
    // First try to get the response as text
    const responseText = await res.text();
    
    // If not ok, throw error with response text
    if (!res.ok) {
      // Check for auth errors and handle them automatically
      if (res.status === 401 || res.status === 403) {
        console.warn('Authentication error detected, clearing auth data');
        handleAuthError();
        throw new Error('Authentication required');
      }
      
      // Try to parse as JSON first
      try {
        const errorJson = JSON.parse(responseText);
        throw new Error(errorJson.message || errorJson.error || 'Request failed');
      } catch (e) {
        // If can't parse as JSON, throw the raw text
        throw new Error(responseText || res.statusText);
      }
    }
    
    // For successful responses, try to parse as JSON if content-type is json
    if (res.headers.get('content-type')?.includes('json')) {
      try {
        return JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid JSON response from server');
      }
    }
    
    // Return empty object for non-JSON responses
    return {};
  } catch (error) {
    // Handle network errors
    if (isNetworkError(error)) {
      const networkError = handleNetworkError(error);
      throw new Error(networkError.description);
    }
    
    // Handle auth errors
    if (checkAuthError(error)) {
      handleAuthError();
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const headers = getAuthHeaders();

      const res = await fetch(queryKey[0] as string, {
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Handle auth errors
      if (checkAuthError(error)) {
        handleAuthError();
      }
      
      throw error;
    }
  };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (checkAuthError(error)) return false;
        // Don't retry on network errors more than once
        if (isNetworkError(error) && failureCount > 1) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

export { queryClient };
