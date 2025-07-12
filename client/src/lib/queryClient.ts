import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Функция для получения заголовков с токеном
function getAuthHeaders(additionalHeaders?: HeadersInit): HeadersInit {
  const token = localStorage.getItem("token"); // Updated to match auth.ts
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Добавляем дополнительные заголовки
  if (additionalHeaders) {
    Object.assign(headers, additionalHeaders);
  }

  return headers;
}

export async function apiRequest(
  url: string,
  options: RequestInit = {},
) {
  const requestOptions: RequestInit = { 
    method: options.method || 'GET',
    headers: getAuthHeaders(options.headers),
    credentials: 'include',
    ...options
  };

  const res = await fetch(url, requestOptions);
  
  // First try to get the response as text
  const responseText = await res.text();
  
  // If not ok, throw error with response text
  if (!res.ok) {
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
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
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
  };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export { queryClient };
