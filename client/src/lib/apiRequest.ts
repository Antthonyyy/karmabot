import { authUtils } from '@/utils/auth';

export interface ApiRequestOptions extends RequestInit {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
}

export async function apiRequest(
  url: string,
  options: ApiRequestOptions = {}
): Promise<any> {
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    const { method = 'GET', body, ...restOptions } = options;
    
    // Log request details
    console.group(`🌐 API Request [${requestId}]`);
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Auth Headers:', authUtils.getAuthHeaders());
    if (body) console.log('Body:', body);
    console.groupEnd();

    const requestOptions: RequestInit = {
      method,
      credentials: 'include', // Enable cookies for CORS
      headers: {
        ...authUtils.getAuthHeaders(),
        'Content-Type': 'application/json',
        ...restOptions.headers,
      },
      ...restOptions,
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);
    const contentType = response.headers.get('content-type');
    
    // Log response details
    console.group(`📥 API Response [${requestId}]`);
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Content-Type:', contentType);
    console.log('Response URL:', response.url); // Detect redirects
    console.groupEnd();

    // Early non-OK response handling
    if (!response.ok) {
      console.group(`❌ API Error [${requestId}]`);
      
      // Handle different response types
      if (contentType?.includes('application/json')) {
        const errorJson = await response.json();
        console.log('JSON Error:', errorJson);
        console.groupEnd();
        throw new Error(errorJson.message || errorJson.error || `Request failed (${response.status})`);
      }
      
      // Handle HTML error pages
      const text = await response.text();
      console.log('Non-JSON Response:', text.substring(0, 200) + '...');
      console.groupEnd();
      
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        if (response.status === 404) {
          throw new Error(`API Endpoint not found: ${url} (404)`);
        } else if (response.status === 401) {
          authUtils.clearAuth(); // Clear invalid auth
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Check your permissions.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Received HTML instead of JSON (${response.status})`);
        }
      }
      
      throw new Error(`Unexpected response format (${response.status})`);
    }

    // Validate JSON response
    if (!contentType?.includes('application/json')) {
      console.error(`⚠️ Non-JSON content type received: ${contentType}`);
      throw new Error('Server returned non-JSON response');
    }

    return response.json();
    
  } catch (error) {
    console.group(`💥 Request Failed [${requestId}]`);
    console.error('Error:', error);
    console.log('Request URL:', url);
    console.log('Is Authenticated:', authUtils.isAuthenticated());
    console.groupEnd();

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to ${url}`);
    }
    throw error;
  }
}
