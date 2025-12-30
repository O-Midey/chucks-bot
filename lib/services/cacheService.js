import Redis from "ioredis";

class CacheService {
  constructor() {
    // Delay creating the Redis client until first use to be serverless-friendly
    this.redis = null;
    this.connected = false;
  }

  async _ensureClient() {
    if (this.redis) return;

    const options = {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };

    this.redis = new Redis(options);

    this.redis.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    this.redis.on("connect", () => {
      this.connected = true;
      console.log("Redis connected successfully");
    });

    try {
      // Connect lazily but attempt a short connect so errors surface early in long-running processes
      await this.redis.connect();
    } catch (err) {
      // In serverless environments connect() may not be desirable; keep lazy but log
      console.log(
        "Redis lazy connection deferred or failed to connect immediately:",
        err.message
      );
    }
  }

  // Generic cache methods
  async get(key) {
    try {
      await this._ensureClient();
      if (!this.redis) return null;
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    try {
      await this._ensureClient();
      if (!this.redis) return false;
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  async del(key) {
    try {
      await this._ensureClient();
      if (!this.redis) return false;
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  // API-specific cache methods
  async getStates() {
    return await this.get("kampe:states");
  }

  async setStates(states) {
    return await this.set("kampe:states", states, 3600); // 1 hour
  }

  async getLGAs(stateId) {
    return await this.get(`kampe:lgas:${stateId}`);
  }

  async setLGAs(stateId, lgas) {
    return await this.set(`kampe:lgas:${stateId}`, lgas, 3600); // 1 hour
  }

  async getProviders() {
    return await this.get("kampe:providers");
  }

  async setProviders(providers) {
    return await this.set("kampe:providers", providers, 1800); // 30 minutes
  }

  // Session methods
  async getSession(userId) {
    return await this.get(`session:${userId}`);
  }

  async setSession(userId, session) {
    return await this.set(`session:${userId}`, session, 600); // 10 minutes
  }

  async deleteSession(userId) {
    return await this.del(`session:${userId}`);
  }

  // Cleanup method
  async cleanup() {
    try {
      // Redis handles TTL automatically, but we can add custom cleanup logic here
      console.log("Cache cleanup completed");
    } catch (error) {
      console.error("Cache cleanup error:", error);
    }
  }

  // Graceful shutdown
  async disconnect() {
    if (this.redis) {
      try {
        await this.redis.disconnect();
      } catch (e) {
        console.error("Error disconnecting Redis:", e);
      }
    }
  }
}

// Export singleton instance
// Use global to avoid multiple clients in serverless warm-processes
const globalKey = globalThis.__CACHE_SERVICE__;
if (!globalThis.__CACHE_SERVICE__) {
  globalThis.__CACHE_SERVICE__ = new CacheService();
}

export const cacheService = globalThis.__CACHE_SERVICE__;
