export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  message?: string;
  meta?: unknown;
}

export const API_BASE_URL = (import.meta as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL || '/api';

export const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Remove Content-Type for FormData (let browser set boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const token = localStorage.getItem('em_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${localStorage.getItem('em_token')}`;
        const retryResponse = await fetch(url, { ...options, headers });
        if (!retryResponse.ok && retryResponse.status === 401) {
          localStorage.removeItem('em_token');
          localStorage.removeItem('em_refresh');
          localStorage.removeItem('em_user');
          window.location.href = '/login';
          throw new Error('Unauthorized');
        }
        return handleResponse<T>(retryResponse);
      } else {
        if (window.location.pathname !== '/login') {
          localStorage.removeItem('em_token');
          localStorage.removeItem('em_refresh');
          localStorage.removeItem('em_user');
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }
    }

    return handleResponse<T>(response);
  } catch (error) {
    console.error(`[API] Error on ${endpoint}:`, error);
    throw error;
  }
};

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (response.status === 204) {
    return { success: true };
  }

  const json = await response.json();
  return {
    data: json as T,
    success: response.ok,
    message: !response.ok ? (json?.detail || json?.message || response.statusText) : undefined,
  };
}

async function tryRefreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem('em_refresh');
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('em_token', data.access);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Convenience helpers
export const get = <T>(endpoint: string) =>
  apiCall<T>(endpoint, { method: 'GET' });

export const post = <T>(endpoint: string, body: unknown) =>
  apiCall<T>(endpoint, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const patch = <T>(endpoint: string, body: unknown) =>
  apiCall<T>(endpoint, {
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

export const del = <T>(endpoint: string) =>
  apiCall<T>(endpoint, { method: 'DELETE' });
