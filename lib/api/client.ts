/**
 * Base HTTP client for API communication
 * Handles common concerns: auth, errors, timeouts
 */

import { ApiError, ApiRequestOptions } from './types';
import { config } from '@/lib/config';

const DEFAULT_TIMEOUT = 30000; // 30 seconds

function buildUrl(baseUrl: string, endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

function buildHeaders(
  customHeaders?: Record<string, string>,
  bearerToken?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  return headers;
}

/**
 * Make a fetch request with common handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {},
  baseUrl: string | undefined = config.agentBaseUrl,
  bearerToken?: string
): Promise<T> {
  if (!baseUrl) {
    throw new ApiError('AGENT_BASE_URL environment variable is not configured', 500);
  }
  const url = buildUrl(baseUrl, endpoint);
  const headers = buildHeaders(options.headers, bearerToken);
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  // Create abort controller for timeout
  const controller = options.signal ? undefined : new AbortController();
  const signal = options.signal || controller?.signal;

  let timeoutId: NodeJS.Timeout | undefined;

  try {
    // Set timeout if using our own abort controller
    if (controller && timeout > 0) {
      timeoutId = setTimeout(() => controller.abort(), timeout);
    }

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      signal,
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorDetails: unknown;
      try {
        errorDetails = await response.json();
      } catch {
        errorDetails = response.statusText;
      }

      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        errorDetails
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError(`Request timeout after ${timeout}ms`, 408);
      }
      throw new ApiError(error.message, 500, error);
    }

    throw new ApiError('Unknown error occurred', 500, error);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Helper methods for common HTTP methods
 */
export const apiClient = {
  get: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = any>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T = any>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
