import { SessionManager } from "../session/sessionManager.js";

/**
 * Centralized state management utility to ensure consistency
 * between session state and returned state
 */
export class StateManager {
  /**
   * Update session and return consistent response
   * @param {string} userId - User ID
   * @param {string} state - New state
   * @param {string} message - Response message
   * @param {object} data - Additional session data
   * @returns {object} Consistent response object
   */
  static updateAndReturn(userId, state, message, data = {}) {
    SessionManager.updateSession(userId, state, data);
    return {
      message,
      state,
    };
  }

  /**
   * Clear session and return to main menu
   * @param {string} userId - User ID
   * @param {string} message - Response message
   * @returns {object} Response object
   */
  static clearAndReturnToMenu(userId, message) {
    SessionManager.clearSession(userId);
    return {
      message,
      state: "main_menu",
    };
  }

  /**
   * Get current session and ensure state consistency
   * @param {string} userId - User ID
   * @returns {object} Session object
   */
  static getSession(userId) {
    return SessionManager.getSession(userId);
  }
}
