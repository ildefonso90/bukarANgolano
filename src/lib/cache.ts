/**
 * Simple in-memory and session storage cache for the application.
 */

type CacheItem<T> = {
  data: T;
  timestamp: number;
};

const MEMORY_CACHE = new Map<string, CacheItem<any>>();
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes default

export const cacheService = {
  /**
   * Get data from cache.
   */
  get: <T>(key: string, useSession = false): T | null => {
    // Check memory first
    const memoryItem = MEMORY_CACHE.get(key);
    if (memoryItem) {
      if (Date.now() - memoryItem.timestamp < CACHE_DURATION) {
        return memoryItem.data;
      }
      MEMORY_CACHE.delete(key);
    }

    // Check session storage if requested
    if (useSession) {
      try {
        const sessionItem = sessionStorage.getItem(`buki_cache_${key}`);
        if (sessionItem) {
          const parsed: CacheItem<T> = JSON.parse(sessionItem);
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            // Repopulate memory cache
            MEMORY_CACHE.set(key, parsed);
            return parsed.data;
          }
          sessionStorage.removeItem(`buki_cache_${key}`);
        }
      } catch (e) {
        console.error('Cache read error:', e);
      }
    }

    return null;
  },

  /**
   * Set data to cache.
   */
  set: <T>(key: string, data: T, useSession = false) => {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };

    MEMORY_CACHE.set(key, item);

    if (useSession) {
      try {
        sessionStorage.setItem(`buki_cache_${key}`, JSON.stringify(item));
      } catch (e) {
        console.error('Cache write error:', e);
      }
    }
  },

  /**
   * Clear specific or all cache.
   */
  clear: (key?: string) => {
    if (key) {
      MEMORY_CACHE.delete(key);
      sessionStorage.removeItem(`buki_cache_${key}`);
    } else {
      MEMORY_CACHE.clear();
      // Only clear our namespaced keys
      Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith('buki_cache_')) {
          sessionStorage.removeItem(k);
        }
      });
    }
  },
};
