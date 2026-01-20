/**
 * KV Store utility functions for Agentuity V1 SDK
 * Uses the native KeyValueStorageService from @agentuity/core
 *
 * IMPORTANT: Only use in server-side code (API routes, server actions)
 * Never expose AGENTUITY_SDK_KEY to the browser
 */

import { KeyValueStorageService } from '@agentuity/core';
import { createServerFetchAdapter, getServiceUrls, createLogger } from '@agentuity/server';
import { config } from './config';

// Types
export interface KVStoreOptions {
  storeName?: string;
}

export interface KVGetResult<T = any> {
  exists: boolean;
  data?: T;
}

export interface KVSetOptions extends KVStoreOptions {
  ttl?: number; // TTL in seconds, minimum 60
}

export interface KVDeleteResult {
  exists: boolean;
}

// Create logger for SDK
const logger = createLogger('info');

// Initialize the KV service
function initializeKVService() {
  if (!process.env.AGENTUITY_SDK_KEY || !process.env.AGENTUITY_REGION) {
    throw new Error('AGENTUITY_SDK_KEY and AGENTUITY_REGION environment variables are required');
  }

  const adapter = createServerFetchAdapter({
    headers: {
      Authorization: `Bearer ${process.env.AGENTUITY_SDK_KEY}`
    },
  }, logger);

  const serviceUrls = getServiceUrls(process.env.AGENTUITY_REGION);
  return new KeyValueStorageService(serviceUrls.keyvalue, adapter);
}

/**
 * Retrieve a value from the KV store
 * @param key - The key to retrieve
 * @param options - Optional configuration with storeName
 * @returns Promise<KVGetResult<T>>
 */
export async function getKVValue<T = any>(
  key: string,
  options: KVStoreOptions = {}
): Promise<KVGetResult<T>> {
  const storeName = options.storeName || config.kvStoreName;

  try {
    const kv = initializeKVService();
    const result = await kv.get(storeName, key);

    return {
      exists: result.exists,
      data: result.data as T
    };
  } catch (error) {
    console.error(`Failed to get KV value for key '${key}':`, error);
    return {
      exists: false
    };
  }
}

/**
 * Set a value in the KV store
 * @param key - The key to set
 * @param value - The value to store
 * @param options - Optional configuration with storeName and TTL (in seconds, min 60)
 * @returns Promise<boolean>
 */
export async function setKVValue(
  key: string,
  value: any,
  options: KVSetOptions = {}
): Promise<boolean> {
  const storeName = options.storeName || config.kvStoreName;
  const ttl = options.ttl;

  // Validate TTL if provided
  if (ttl !== undefined && ttl < 60) {
    throw new Error('TTL must be at least 60 seconds');
  }

  try {
    const kv = initializeKVService();
    const setOptions = ttl ? { ttl } : undefined;
    await kv.set(storeName, key, value, setOptions);
    return true;
  } catch (error) {
    console.error(`Failed to set KV value for key '${key}':`, error);
    return false;
  }
}

/**
 * Delete a value from the KV store
 * @param key - The key to delete
 * @param options - Optional configuration with storeName
 * @returns Promise<boolean>
 */
export async function deleteKVValue(
  key: string,
  options: KVStoreOptions = {}
): Promise<boolean> {
  const storeName = options.storeName || config.kvStoreName;

  try {
    const kv = initializeKVService();
    await kv.delete(storeName, key);
    return true;
  } catch (error) {
    console.error(`Failed to delete KV value for key '${key}':`, error);
    return false;
  }
} 