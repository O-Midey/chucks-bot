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
  // Simple concurrency limiter to avoid spawning unlimited background tasks
  static _concurrencyLimit = parseInt(
    process.env.LOADING_CONCURRENCY_LIMIT || "4"
  );
  static _running = 0;
  static _queue = [];

  static async _runTask(taskFn) {
    if (this._running < this._concurrencyLimit) {
      this._running += 1;
      try {
        return await taskFn();
      } finally {
        this._running -= 1;
        // Dequeue next
        const next = this._queue.shift();
        if (next) this._runTask(next);
      }
    } else {
      // enqueue and return a promise that resolves when executed
      return new Promise((resolve, reject) => {
        this._queue.push(async () => {
          try {
            const res = await taskFn();
            resolve(res);
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }

  static callWithLoading(userId, loadingMessage, apiTask) {
    // Schedule the task (after a tiny delay) but limit concurrency
    setTimeout(() => {
      this._runTask(async () => {
        try {
          // The apiTask is an async function that returns the final message and the next state
          const { message: finalMessage, state: nextState } = await apiTask();

          await SessionManager.updateSession(userId, nextState);

          const whatsappService = new WhatsAppService(
            process.env.DIALOG_360_API_KEY
          );
          if (process.env.TEST_MODE !== "true" && finalMessage) {
            await whatsappService.sendMessage(userId, finalMessage);
          } else {
            console.log(`TEST MODE: Would send to ${userId}: ${finalMessage}`);
          }
        } catch (error) {
          console.error("Error in async loading task:", error);
          const whatsappService = new WhatsAppService(
            process.env.DIALOG_360_API_KEY
          );
          if (process.env.TEST_MODE !== "true") {
            try {
              await whatsappService.sendMessage(
                userId,
                "An unexpected error occurred. Please try again."
              );
            } catch (e) {
              console.error("Failed sending error message to user:", e);
            }
          } else {
            console.log(`TEST MODE: Would send error to ${userId}`);
          }
          await SessionManager.updateSession(userId, STATES.MAIN_MENU);
        }
      });
    }, 100);

    // Return the loading message immediately
    return {
      message: `🔄 *${loadingMessage}*\n\nPlease wait...`,
      state: STATES.PROCESSING,
    };
  }
}
