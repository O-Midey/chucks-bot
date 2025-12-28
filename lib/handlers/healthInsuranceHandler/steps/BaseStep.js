import { STATES } from "../../../config/constants.js";
import { SessionManager } from "../../../session/sessionManager.js";
import { StateManager } from "../../../utils/stateManager.js";

export class BaseStep {
  constructor(userId) {
    this.userId = userId;
    this.session = SessionManager.getSession(userId);
  }

  validateSession(expectedState) {
    const session = SessionManager.getSession(this.userId);

    // Check if session state doesn't match expected state (state mismatch)
    if (session.state !== expectedState && !session.isNew) {
      return {
        isValid: false,
        message: `⚠️ *State Mismatch*\n\nSomething went wrong with your session state.\n\nType MENU to start over.`,
        state: STATES.MAIN_MENU,
      };
    }

    return { isValid: true };
  }

  updateSession(state, data = {}) {
    SessionManager.updateSession(this.userId, state, data);
  }

  getSessionData() {
    return this.session.data;
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
