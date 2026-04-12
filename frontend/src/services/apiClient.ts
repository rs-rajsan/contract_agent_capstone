import { logger } from '../utils/logger';

// Used to communicate auth failures out-of-band to React components
type AuthListener = () => void;
const listeners = new Set<AuthListener>();

export const authEventBus = {
  subscribe: (listener: AuthListener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emitUnauthorized: () => {
    listeners.forEach(listener => listener());
  }
};

// In-memory token store avoids writing tokens to localStorage directly (better XSS resistance)
// We also use sessionStorage so refreshing the tab doesn't drop the token.
export const tokenStore = {
  get: () => sessionStorage.getItem('access_token'),
  set: (token: string) => sessionStorage.setItem('access_token', token),
  clear: () => sessionStorage.removeItem('access_token')
};

export class ApiError extends Error {
  constructor(public status: number, public data: any) {
    super(`API Error: ${status}`);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = tokenStore.get();
  // Using a robust fallback for correlation ID in case randomUUID isn't available
  const correlationId = typeof crypto.randomUUID === 'function' 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 15);

  logger.debug(`API Request: ${options?.method || 'GET'} ${path}`, { correlationId });

  // When running in a browser outside of docker, 'backend' doesn't resolve.
  // We prefer localhost if we are running in a browser context.
  const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || '';
  const BACKEND_URL = rawBackendUrl.includes('backend:8000') 
    ? 'http://localhost:8000' 
    : (rawBackendUrl || 'http://localhost:8000');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Correlation-ID': correlationId,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge headers
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }

  // Handle FormData where we don't want to specify Content-Type manually
  if (options?.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Auto-logout event
      tokenStore.clear();
      authEventBus.emitUnauthorized();
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      logger.error(`API Error: ${response.status} ${path}`, { correlationId, status: response.status, errorData });
      throw new ApiError(response.status, errorData);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`API Fetch Failure: ${path}`, { correlationId, error: message });
    throw error;
  }
}
