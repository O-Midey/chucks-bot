import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";

export class LoadingWrapper {
  static async withLoading(userId, apiCall, loadingMessage) {
    // Set processing state
    SessionManager.updateSession(userId, STATES.HEALTH_PROCESSING);
    
    // Execute API call
    const result = await apiCall();
    
    // Return result with loading message for user display
    return {
      ...result,
      userMessage: loadingMessage
    };
  }
  
  static getLoadingResponse(message) {
    return {
      message: `🔄 *${message}*\n\nPlease wait...`,
      state: STATES.HEALTH_PROCESSING,
    };
  }
}