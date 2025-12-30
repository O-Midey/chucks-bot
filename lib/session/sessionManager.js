import { STATES, SESSION_TIMEOUT } from "../config/constants.js";
import { cacheService } from "../services/cacheService.js";

// Fallback in-memory sessions for when Redis is unavailable
const fallbackSessions = new Map();

export class SessionManager {
  static async getSession(userId) {
    try {
      // Try Redis first (read-only). Do not mutate or write on read to reduce write churn.
      const session = await cacheService.getSession(userId);
      if (session) return session;

      // No session in cache - create a fresh one but don't persist it here. Callers should explicitly persist when needed.
      return {
        state: STATES.MAIN_MENU,
        data: {},
        lastActivity: Date.now(),
        isNew: true,
      };
    } catch (error) {
      console.error("Redis session error, using fallback:", error);
      // Fallback to in-memory
      return this.getFallbackSession(userId);
    }
  }

  // Explicitly update lastActivity and persist session to cache
  static async touchSession(userId) {
    try {
      let session = await cacheService.getSession(userId);
      if (!session) {
        session = {
          state: STATES.MAIN_MENU,
          data: {},
          lastActivity: Date.now(),
          isNew: true,
        };
      }
      session.lastActivity = Date.now();
      await cacheService.setSession(userId, session);
      return session;
    } catch (error) {
      console.error("Redis touchSession error, using fallback:", error);
      const session = this.getFallbackSession(userId);
      session.lastActivity = Date.now();
      fallbackSessions.set(userId, session);
      return session;
    }
  }

  static getFallbackSession(userId) {
    if (!fallbackSessions.has(userId)) {
      fallbackSessions.set(userId, {
        state: STATES.MAIN_MENU,
        data: {},
        lastActivity: Date.now(),
        isNew: true,
      });
    }
    const session = fallbackSessions.get(userId);
    session.lastActivity = Date.now();
    return session;
  }

  static async updateSession(userId, state, data = {}) {
    try {
      // Read current session once, merge updates, write back once to reduce Redis operations
      let session = await cacheService.getSession(userId);
      if (!session) {
        session = {
          state: state || STATES.MAIN_MENU,
          data: {},
          lastActivity: Date.now(),
          isNew: false,
        };
      }

      if (state) session.state = state;
      session.data = { ...session.data, ...data };
      session.isNew = false;
      session.lastActivity = Date.now();
      await cacheService.setSession(userId, session);
    } catch (error) {
      console.error("Redis update error, using fallback:", error);
      // Fallback to in-memory
      const session = this.getFallbackSession(userId);
      session.state = state;
      session.data = { ...session.data, ...data };
      session.isNew = false;
      fallbackSessions.set(userId, session);
    }
  }

  static async clearSession(userId) {
    try {
      await cacheService.deleteSession(userId);
    } catch (error) {
      console.error("Redis clear error:", error);
    }
    // Also clear fallback
    fallbackSessions.delete(userId);
  }

  static async checkTimeout(userId) {
    try {
      const session = await cacheService.getSession(userId);
      if (session && Date.now() - session.lastActivity > SESSION_TIMEOUT) {
        await this.clearSession(userId);
        return {
          timedOut: true,
          message: `_ ⏰ Your session has expired due to inactivity for more than 10 minutes.\n\n\nYour registration progress has been cleared for security reasons.\n\n\nType MENU to start over._`,
        };
      }
    } catch (error) {
      console.error("Redis timeout check error:", error);
    }
    return { timedOut: false };
  }

  static async cleanupOldSessions() {
    try {
      // Redis handles TTL automatically, but clean up fallback sessions
      const now = Date.now();
      for (const [userId, session] of fallbackSessions.entries()) {
        if (now - session.lastActivity > SESSION_TIMEOUT) {
          fallbackSessions.delete(userId);
          console.log(`Cleaned up fallback session for user: ${userId}`);
        }
      }
    } catch (error) {
      console.error("Session cleanup error:", error);
    }
  }
}
