import { STATES, SESSION_TIMEOUT } from "../config/constants.js";

const sessions = new Map();

export class SessionManager {
  static getSession(userId) {
    if (!sessions.has(userId)) {
      sessions.set(userId, {
        state: STATES.MAIN_MENU,
        data: {},
        lastActivity: Date.now(),
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
    sessions.set(userId, session);
  }

  static clearSession(userId) {
    sessions.delete(userId);
  }

  static checkTimeout(userId) {
    const session = sessions.get(userId);
    if (session && Date.now() - session.lastActivity > SESSION_TIMEOUT) {
      this.clearSession(userId);
      return true;
    }
    return false;
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
