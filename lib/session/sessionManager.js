import { STATES, SESSION_TIMEOUT } from "../config/constants.js";

const sessions = new Map();
const serverStartTime = Date.now();

export class SessionManager {
  static getSession(userId) {
    if (!sessions.has(userId)) {
      sessions.set(userId, {
        state: STATES.MAIN_MENU,
        data: {},
        lastActivity: Date.now(),
        isNew: true, // Flag to indicate this is a fresh session
      });
    }
    const session = sessions.get(userId);
    session.lastActivity = Date.now();
    return session;
  }

  static updateSession(userId, state, data = {}) {
    const session = this.getSession(userId);
    session.state = state;
    session.data = { ...session.data, ...data };
    session.isNew = false; // Mark as no longer new once updated
    sessions.set(userId, session);
  }

  static clearSession(userId) {
    sessions.delete(userId);
  }

  static checkTimeout(userId) {
    const session = sessions.get(userId);
    if (session && Date.now() - session.lastActivity > SESSION_TIMEOUT) {
      this.clearSession(userId);
      return {
        timedOut: true,
        message: `_ ⏰ Your session has expired due to inactivity for more than 10 minutes.\n\n\n
        Your registration progress has been cleared for security reasons.\n\n\n
        Type MENU to start over._`,
      };
    }
    return { timedOut: false };
  }

  static isServerRecentlyRestarted() {
    return Date.now() - serverStartTime < 30000; // 30 seconds
  }

  static getRestartMessage() {
    return `Oops! Your session was cleared 😬\n\nType MENU to start over.`;
  }

  static cleanupOldSessions() {
    const now = Date.now();
    for (const [userId, session] of sessions.entries()) {
      if (now - session.lastActivity > SESSION_TIMEOUT) {
        sessions.delete(userId);
        console.log(`Cleaned up session for user: ${userId}`);
      }
    }
  }
}
