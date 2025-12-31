// Vercel-optimized in-memory cache service
// Uses global object to persist across warm function invocations

class VercelCacheService {
  constructor() {
    // Use global to persist cache across warm serverless invocations
    if (!globalThis.__VERCEL_CACHE__) {
      globalThis.__VERCEL_CACHE__ = new Map();
    }
    this.cache = globalThis.__VERCEL_CACHE__;
  }

  // Generic cache methods
  get(key) {
    try {
      const item = this.cache.get(key);
      if (!item) return null;

      // Check if expired
      if (Date.now() > item.expires) {
        this.cache.delete(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  set(key, value, ttlSeconds = 3600) {
    try {
      const expires = Date.now() + (ttlSeconds * 1000);
      this.cache.set(key, {
        data: value,
        expires,
        created: Date.now()
      });
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  del(key) {
    try {
      return this.cache.delete(key);
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  // API-specific cache methods
  getStates() {
    return this.get("kampe:states");
  }

  setStates(states) {
    return this.set("kampe:states", states, 3600); // 1 hour
  }

  getLGAs(stateId) {
    return this.get(`kampe:lgas:${stateId}`);
  }

  setLGAs(stateId, lgas) {
    return this.set(`kampe:lgas:${stateId}`, lgas, 3600); // 1 hour
  }

  getProviders() {
    return this.get("kampe:providers");
  }

  setProviders(providers) {
    return this.set("kampe:providers", providers, 1800); // 30 minutes
  }

  // Session methods (shorter TTL for sessions)
  getSession(userId) {
    return this.get(`session:${userId}`);
  }

  setSession(userId, session) {
    return this.set(`session:${userId}`, session, 600); // 10 minutes
  }

  deleteSession(userId) {
    return this.del(`session:${userId}`);
  }

  // Cleanup expired entries (called periodically)
  cleanup() {
    try {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, item] of this.cache.entries()) {
        if (now > item.expires) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`Cache cleanup: removed ${cleaned} expired entries`);
      }
    } catch (error) {
      console.error("Cache cleanup error:", error);
    }
  }

  // Get cache stats (useful for monitoring)
  getStats() {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      memoryUsage: process.memoryUsage()
    };
  }

  // Clear all cache (useful for testing)
  clear() {
    this.cache.clear();
  }

  // No-op methods for compatibility with Redis interface
  async disconnect() {
    // Nothing to disconnect in memory cache
  }

  isAvailable() {
    return true; // Always available
  }
}

// Export singleton instance
export const cacheService = new VercelCacheService();
