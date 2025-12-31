import { STATES } from "../../../config/constants.js";
import { SessionManager } from "../../../session/sessionManager.js";
import { StateManager } from "../../../utils/stateManager.js";

export class BaseStep {
  constructor(userId) {
    this.userId = userId;
  }

  getSession() {
    return SessionManager.getSession(this.userId);
  }

  validateSession(expectedState) {
    // This method can remain sync for now
    // Session validation logic here
    return { isValid: true };
  }

  updateSession(state, data = {}) {
    SessionManager.updateSession(this.userId, state, data);
  }

  getSessionData() {
    const session = this.getSession();
    return session.data;
  }

  async handleGlobalCommands(input, currentState) {
    // Validate session first
    const validation = this.validateSession(currentState);
    if (!validation.isValid) {
      return validation;
    }

    if (input === "back" || input === "previous") {
      return await this.goBack(currentState);
    }
    return null;
  }

  async goBack(currentState) {
    // To be implemented by subclasses
    return null;
  }

  createResponse(message, state) {
    return { message, state };
  }
}
