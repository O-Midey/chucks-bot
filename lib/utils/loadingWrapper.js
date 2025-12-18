import { STATES } from "../config/constants.js";
import { WhatsAppService } from "../services/whatsappService.js";
import { SessionManager } from "../session/sessionManager.js";

export class LoadingWrapper {
  /**
   * Wraps an asynchronous task with a loading message.
   * It immediately returns a loading message for the user,
   * then executes the async task and sends the result back to the user.
   * @param {string} userId The user's ID.
   * @param {string} loadingMessage The message to show while processing.
   * @param {() => Promise<{message: string, state: string}>} apiTask An async function that performs the long-running task and returns an object with the final message and the next state.
   * @returns {{message: string, state: string}} The loading message object to be sent to the user immediately.
   */
  static callWithLoading(userId, loadingMessage, apiTask) {
    
    setTimeout(() => {
      (async () => {
        try {
          // The apiTask is an async function that returns the final message and the next state
          const { message: finalMessage, state: nextState } = await apiTask();
          
          SessionManager.updateSession(userId, nextState);
          
          const whatsappService = new WhatsAppService(process.env.DIALOG_360_API_KEY);
          if (process.env.TEST_MODE !== 'true' && finalMessage) {
            await whatsappService.sendMessage(userId, finalMessage);
          } else {
            console.log(`TEST MODE: Would send to ${userId}: ${finalMessage}`);
          }

        } catch (error) {
          console.error("Error in async loading task:", error);
          const whatsappService = new WhatsAppService(process.env.DIALOG_360_API_KEY);
          if (process.env.TEST_MODE !== 'true') {
            await whatsappService.sendMessage(userId, "An unexpected error occurred. Please try again.");
          } else {
            console.log(`TEST MODE: Would send error to ${userId}`);
          }
          SessionManager.updateSession(userId, STATES.MAIN_MENU);
        }
      })();
    }, 100);

    // Return the loading message immediately
    return {
      message: `🔄 *${loadingMessage}*\n\nPlease wait...`,
      state: STATES.PROCESSING,
    };
  }
}