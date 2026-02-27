// API response caching layer using localStorage
// Wraps TMDB calls to reduce redundant API requests

const CACHE_PREFIX = 'tmdb_cache:';

interface CacheEntry<T = unknown> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

// TTLs in milliseconds
export const TTL = {
  SEARCH: 60 * 60 * 1000,           // 1 hour
  MOVIE_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
  SIMILAR_MOVIES: 24 * 60 * 60 * 1000,
  GENRES: 7 * 24 * 60 * 60 * 1000,    // 1 week
} as const;

function cacheKey(endpoint: string, params: string): string {
  return `${CACHE_PREFIX}${endpoint}:${params}`;
}

export function getCached<T>(endpoint: string, params: string): T | null {
  try {
    const key = cacheKey(endpoint, params);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(endpoint: string, params: string, data: T, ttl: number): void {
  try {
    const key = cacheKey(endpoint, params);
    const entry: CacheEntry<T> = {
      data,
      cachedAt: Date.now(),
      expiresAt: Date.now() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage full — evict expired entries and retry
    clearExpiredCache();
    try {
      const key = cacheKey(endpoint, params);
      const entry: CacheEntry<T> = {
        data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttl,
      };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Still full — silently fail, app works without cache
    }
  }
}

export function clearExpiredCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(CACHE_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() > entry.expiresAt) {
        keysToRemove.push(key);
      }
    } catch {
      keysToRemove.push(key!);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

export function clearAllCache(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
