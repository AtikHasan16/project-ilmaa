/**
 * Lightweight in-memory query cache with TTL, in-flight request deduplication,
 * and pattern-based invalidation.
 *
 * Prevents redundant roundtrips across tab switches (Flashcard <-> Spelling <-> Dashboard)
 * while ensuring mutations instantly invalidate stale cache entries.
 */

class QueryCache {
  constructor() {
    this.cache = new Map();
    this.inFlight = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key, data, ttlMs = 60000) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  invalidate(patternOrKey) {
    if (typeof patternOrKey === "string") {
      for (const key of this.cache.keys()) {
        if (key === patternOrKey || key.startsWith(patternOrKey)) {
          this.cache.delete(key);
        }
      }
    } else if (patternOrKey instanceof RegExp) {
      for (const key of this.cache.keys()) {
        if (patternOrKey.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  async fetch(key, fetcherFn, ttlMs = 60000) {
    // 1. Return fresh cached data if available
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // 2. Deduplicate simultaneous in-flight promises
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    const promise = (async () => {
      try {
        const result = await fetcherFn();
        this.set(key, result, ttlMs);
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  clear() {
    this.cache.clear();
    this.inFlight.clear();
  }
}

export const queryCache = new QueryCache();

// Specific invalidation helpers for application domains
export function invalidateVocabularyCache() {
  queryCache.invalidate("vocab:");
}

export function invalidateAuditCache() {
  queryCache.invalidate("audit:");
}

export function invalidateProfileCache() {
  queryCache.invalidate("profile:");
}
