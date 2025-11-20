/**
 * Agentuity KV Storage Adapter (REST API)
 *
 * Implements storage operations using Agentuity's KV Store REST API.
 * This will be replaced with SDK-based implementation when available.
 */

import type { IStorageAdapter, StorageResult, StorageOptions } from './types';

export class AgentuityKVAdapter implements IStorageAdapter {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.AGENTUITY_API_URL || 'https://api.agentuity.com';
    this.apiKey = process.env.AGENTUITY_API_KEY || '';

    if (!this.apiKey) {
      console.warn('AGENTUITY_API_KEY not set - storage operations will fail');
    }
  }

  /**
   * Get a value from Agentuity KV
   */
  async get<T>(bucket: string, key: string): Promise<StorageResult<T>> {
    try {
      const url = `${this.baseUrl}/sdk/kv/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      // 404 means key doesn't exist (not an error)
      if (response.status === 404) {
        return { exists: false };
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`KV GET failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { exists: true, data: data as T };

    } catch (error) {
      console.error('KV get error:', { bucket, key, error });
      return {
        exists: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Set a value in Agentuity KV
   */
  async set<T>(bucket: string, key: string, value: T, options?: StorageOptions): Promise<void> {
    try {
      // Construct URL with optional TTL
      const ttlParam = options?.ttl ? `/${options.ttl}` : '';
      const url = `${this.baseUrl}/sdk/kv/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}${ttlParam}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`KV SET failed with status ${response.status}: ${errorText}`);
      }

    } catch (error) {
      console.error('KV set error:', { bucket, key, error });
      throw error; // Re-throw to let caller handle
    }
  }

  /**
   * Delete a value from Agentuity KV
   */
  async delete(bucket: string, key: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/sdk/kv/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      // 404 is OK (key already doesn't exist)
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`KV DELETE failed with status ${response.status}: ${errorText}`);
      }

    } catch (error) {
      console.error('KV delete error:', { bucket, key, error });
      throw error; // Re-throw to let caller handle
    }
  }
}
