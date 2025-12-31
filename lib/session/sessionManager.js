import { STATES, SESSION_TIMEOUT } from "../config/constants.js";
import { cacheService } from "../services/cacheService.js";

// Fallback in-memory sessions (same as cache, but separate namespace)
const fallbackSessions = new Map();

export class SessionManager {
  static getSession(userId) {
    try {
      // Try cache first
      let session = cacheService.getSession(userId);

      if (!session) {
        // Create new session
        session = {
          state: STATES.MAIN_MENU,
          data: {},
          lastActivity: Date.now(),
          isNew: true,
        };
        cacheService.setSession(userId, session);
      } else {
        // Update last activity
        session.lastActivity = Date.now();
        cacheService.setSession(userId, session);
      }

      return session;
    } catch (error) {
      console.error("Cache session error, using fallback:", error);
      // Fallback to local Map
      return this.getFallbackSession(userId);
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

  static updateSession(userId, state, data = {}) {
    try {
      const session = this.getSession(userId);
      session.state = state;
      session.data = { ...session.data, ...data };
      session.isNew = false;
      cacheService.setSession(userId, session);
    } catch (error) {
      console.error("Cache update error, using fallback:", error);
      // Fallback to local Map
      const session = this.getFallbackSession(userId);
      session.state = state;
      session.data = { ...session.data, ...data };
      session.isNew = false;
      fallbackSessions.set(userId, session);
    }
  }

  static clearSession(userId) {
    try {
      cacheService.deleteSession(userId);
    } catch (error) {
      console.error("Cache clear error:", error);
    }
    // Also clear fallback
    fallbackSessions.delete(userId);
  }

  static checkTimeout(userId) {
    try {
      const session = cacheService.getSession(userId);
      if (session && Date.now() - session.lastActivity > SESSION_TIMEOUT) {
        this.clearSession(userId);
        return {
          timedOut: true,
          message: "_ ⏰ Your session has expired due to inactivity for more than 10 minutes.\n\n\nYour registration progress has been cleared for security reasons.\n\n\nType MENU to start over._",
        };
      }
    } catch (error) {
      console.error("Cache timeout check error:", error);
    }
    return { timedOut: false };
  }

  static cleanupOldSessions() {
    try {
      // Cache service handles its own cleanup
      cacheService.cleanup();

      // Clean up fallback sessions
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
