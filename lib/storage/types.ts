/**
 * Storage Layer Types
 *
 * Defines interfaces for storage operations, providing an abstraction
 * layer over Agentuity KV Store. This allows for easy migration from
 * REST API to SDK implementation.
 */

/**
 * Result type for storage operations that may or may not find data
 */
export interface StorageResult<T> {
  /** Whether the key exists in storage */
  exists: boolean;
  /** The data if found, undefined otherwise */
  data?: T;
  /** Error message if operation failed */
  error?: string;
}

/**
 * Storage adapter interface
 *
 * All storage implementations must implement this interface.
 * Currently supports basic CRUD operations on Agentuity KV.
 *
 * Note: search() and list() are NOT yet supported by Agentuity KV API
 */
export interface IStorageAdapter {
  /**
   * Get a value from storage
   * @param bucket - The KV bucket/namespace name
   * @param key - The key to retrieve
   * @returns StorageResult with data if found
   */
  get<T>(bucket: string, key: string): Promise<StorageResult<T>>;

  /**
   * Set a value in storage
   * @param bucket - The KV bucket/namespace name
   * @param key - The key to set
   * @param value - The value to store (will be JSON serialized)
   * @param options - Optional settings like TTL
   */
  set<T>(bucket: string, key: string, value: T, options?: StorageOptions): Promise<void>;

  /**
   * Delete a value from storage
   * @param bucket - The KV bucket/namespace name
   * @param key - The key to delete
   */
  delete(bucket: string, key: string): Promise<void>;
}

/**
 * Options for storage operations
 */
export interface StorageOptions {
  /** Time-to-live in seconds (minimum 60s if specified) */
  ttl?: number;
}
