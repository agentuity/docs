/**
 * KV Store utility functions for Agentuity
 * Handles communication with the Agentuity KV store API
 */

import { config } from './config';

// Types
export interface KVStoreOptions {
  storeName?: string;
}

export interface KVStoreResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Shared validation function for KV store operations
 */
function validateKVRequest(key: string): KVStoreResponse | null {
  if (!key) {
    return {
      success: false,
      error: 'Key parameter is required'
    };
  }

  if (!process.env.AGENTUITY_API_KEY) {
    return {
      success: false,
      error: 'AGENTUITY_API_KEY environment variable is required'
    };
  }

  return null;
}

/**
 * Retrieve a value from the KV store
 * @param key - The key to retrieve
 * @param options - Optional configuration
 * @returns Promise<KVStoreResponse<T>>
 */
export async function getKVValue<T = any>(
  key: string,
  options: KVStoreOptions = {}
): Promise<KVStoreResponse<T>> {
  const { storeName } = options;
  const finalStoreName = storeName || config.defaultStoreName;

  // Validate required parameters
  const validationError = validateKVRequest(key);
  if (validationError) {
    return validationError;
  }

  try {
    const url = `${config.baseUrl}/sdk/kv/${encodeURIComponent(finalStoreName)}/${encodeURIComponent(key)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.AGENTUITY_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Next.js KV Client'
      }
    });

    if (response.status === 404) {
      return {
        success: false,
        error: `Key '${key}' not found in store '${finalStoreName}'`,
        statusCode: 404
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        statusCode: response.status
      };
    }

    const data = await response.text();

    try {
      const jsonData = JSON.parse(data) as T;
      return {
        success: true,
        data: jsonData,
        statusCode: response.status
      };
    } catch (parseError) {
      // Return raw data if JSON parsing fails
      return {
        success: true,
        data: data as T,
        statusCode: response.status
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Set a value in the KV store
 * @param key - The key to set
 * @param value - The value to store
 * @param options - Optional configuration including TTL
 * @returns Promise<KVStoreResponse>
 */
export async function setKVValue(
  key: string,
  value: any,
  options: KVStoreOptions & { ttl?: number } = {}
): Promise<KVStoreResponse> {
  const { storeName, ttl } = options;
  const finalStoreName = storeName || config.defaultStoreName;

  // Validate required parameters
  const validationError = validateKVRequest(key);
  if (validationError) {
    return validationError;
  }

  try {
    const ttlStr = ttl ? `/${ttl}` : '';
    const url = `${config.baseUrl}/sdk/kv/${encodeURIComponent(finalStoreName)}/${encodeURIComponent(key)}${ttlStr}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.AGENTUITY_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Next.js KV Client'
      },
      body: JSON.stringify(value)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        statusCode: response.status
      };
    }

    return {
      success: true,
      statusCode: response.status
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Delete a value from the KV store
 * @param key - The key to delete
 * @param options - Optional configuration
 * @returns Promise<KVStoreResponse>
 */
export async function deleteKVValue(
  key: string,
  options: KVStoreOptions = {}
): Promise<KVStoreResponse> {
  const { storeName } = options;
  const finalStoreName = storeName || config.defaultStoreName;

  // Validate required parameters
  const validationError = validateKVRequest(key);
  if (validationError) {
    return validationError;
  }

  try {
    const url = `${config.baseUrl}/sdk/kv/${encodeURIComponent(finalStoreName)}/${encodeURIComponent(key)}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.AGENTUITY_API_KEY}`,
        'User-Agent': 'Next.js KV Client'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        statusCode: response.status
      };
    }

    return {
      success: true,
      statusCode: response.status
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Search for keys in the KV store by keyword pattern
 * @param keyword - The keyword pattern to search for
 * @param options - Optional configuration
 * @returns Promise<KVStoreResponse<Array<{key: string, value: any, metadata?: any}>>>
 */
export async function searchKVByKeyword<T = any>(
  keyword: string,
  options: KVStoreOptions = {}
): Promise<KVStoreResponse<Array<{key: string, value: T, metadata?: any}>>> {
  const { storeName } = options;
  const finalStoreName = storeName || config.defaultStoreName;

  // Validate API key
  if (!process.env.AGENTUITY_API_KEY) {
    return {
      success: false,
      error: 'AGENTUITY_API_KEY environment variable is required'
    };
  }

  try {
    const url = `${config.baseUrl}/sdk/kv/search/${encodeURIComponent(finalStoreName)}/${encodeURIComponent(keyword)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.AGENTUITY_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Next.js KV Client'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        statusCode: response.status
      };
    }

    const data = await response.text();

    try {
      const jsonData = JSON.parse(data);
      return {
        success: true,
        data: jsonData,
        statusCode: response.status
      };
    } catch (parseError) {
      return {
        success: false,
        error: 'Failed to parse search results as JSON',
        statusCode: response.status
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 