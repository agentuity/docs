/**
 * In-Memory Cache with TTL Support
 *
 * Simple cache implementation for storing frequently accessed data.
 * When scaling horizontally, replace this with Redis.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout | null;

  /**
   * @param defaultTTL - Default time-to-live in seconds (default: 300 = 5 minutes)
   * @param cleanupIntervalSeconds - How often to clean expired entries (default: 60 seconds)
   */
  constructor(defaultTTL: number = 300, cleanupIntervalSeconds: number = 60) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    this.cleanupInterval = null;

    // Start cleanup interval
    this.startCleanup(cleanupIntervalSeconds);
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time-to-live in seconds (optional, uses default if not specified)
   */
  set(key: string, data: T, ttl?: number): void {
    const ttlSeconds = ttl ?? this.defaultTTL;
    const expiresAt = Date.now() + (ttlSeconds * 1000);

    this.cache.set(key, {
      data,
      expiresAt,
    });
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(intervalSeconds: number): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let removed = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          removed++;
        }
      }

      if (removed > 0) {
        console.log(`[MemoryCache] Cleaned up ${removed} expired entries`);
      }
    }, intervalSeconds * 1000);

    // Ensure cleanup stops when process exits
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop the cleanup interval (call when shutting down)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

/**
 * Singleton cache instances for different data types
 */
export const sessionCache = new MemoryCache(900); // 15 minutes TTL for sessions
export const sessionListCache = new MemoryCache(300); // 5 minutes TTL for session lists
