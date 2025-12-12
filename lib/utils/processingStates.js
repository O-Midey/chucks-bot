import { STATES } from "../config/constants.js";

export class ProcessingStates {
  static createLoadingResponse(operation, nextState) {
    const messages = {
      'providers': '🔄 *Loading healthcare providers...*\n\nPlease wait, this may take a moment.',
      'enrollment': '⏳ *Processing registration...*\n\nPlease wait, do not send messages.',
      'states': '🔄 *Loading states...*\n\nPlease wait.',
      'lgas': '🔄 *Loading areas...*\n\nPlease wait.',
    };

    return {
      message: messages[operation] || '⏳ *Processing...*\n\nPlease wait.',
      state: STATES.HEALTH_PROCESSING,
      nextState: nextState
    };
  }

  static handleProcessingState() {
    return {
      message: '⏳ *Still processing...*\n\nPlease wait, your request is being processed.\n\n_Do not send messages until complete._',
      state: STATES.HEALTH_PROCESSING,
    };
  }
}