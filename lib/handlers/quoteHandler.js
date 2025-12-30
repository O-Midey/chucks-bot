import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { HealthInsuranceHandler } from "./healthInsuranceHandler/healthInsuranceHandler.js";
import { LoadingWrapper } from "../utils/loadingWrapper.js";
import { MessageTemplates } from "../utils/messageUtils.js";
import { WhatsAppService } from "../services/whatsappService.js";

export class QuoteHandler {
  static async handle(userId, input, text) {
    if (input === "1" || input.includes("health")) {
      SessionManager.updateSession(userId, STATES.HEALTH_PLANS_LIST, {
        insuranceType: "health",
      });
      return await HealthInsuranceHandler.showPlans(userId);

      //       return {
      //         message: `🏥 *Health Insurance Quote*

      // Is this insurance for:

      // 1️⃣ Just me
      // 2️⃣ My family

      // _Please select an option._`,
      //         state: STATES.HEALTH_USER_TYPE,
      //       };
    }

    if (input === "2" || input.includes("auto") || input.includes("car")) {
      // Auto is not available yet — inform user and schedule return to main menu
      await SessionManager.updateSession(userId, STATES.MAIN_MENU, {
        insuranceType: "auto",
      });
      const message = `🚗 *Auto Insurance*\n\nThis feature is coming soon. I'll take you back to the main menu now.`;

      // Schedule sending the main menu after 5 seconds in background
      LoadingWrapper._runTask(async () => {
        await new Promise((r) => setTimeout(r, 5000));
        const whatsapp = new WhatsAppService(process.env.DIALOG_360_API_KEY);
        if (process.env.TEST_MODE !== "true") {
          try {
            await whatsapp.sendMessage(userId, MessageTemplates.getMainMenu());
          } catch (e) {
            console.error(
              "Error sending main menu after coming-soon:",
              e?.response?.data || e.message
            );
          }
        } else {
          console.log(`TEST MODE: Would send main menu to ${userId}`);
        }
      });

      return { message, state: STATES.MAIN_MENU };
    }

    if (
      input === "3" ||
      input.includes("device") ||
      input.includes("phone") ||
      input.includes("gadget")
    ) {
      await SessionManager.updateSession(userId, STATES.MAIN_MENU, {
        insuranceType: "device",
      });
      const message = `📱 *Device Insurance*\n\nThis feature is coming soon. I'll take you back to the main menu now.`;

      LoadingWrapper._runTask(async () => {
        await new Promise((r) => setTimeout(r, 5000));
        const whatsapp = new WhatsAppService(process.env.DIALOG_360_API_KEY);
        if (process.env.TEST_MODE !== "true") {
          try {
            await whatsapp.sendMessage(userId, MessageTemplates.getMainMenu());
          } catch (e) {
            console.error(
              "Error sending main menu after coming-soon:",
              e?.response?.data || e.message
            );
          }
        } else {
          console.log(`TEST MODE: Would send main menu to ${userId}`);
        }
      });

      return { message, state: STATES.MAIN_MENU };
    }

    if (input === "4" || input.includes("life")) {
      await SessionManager.updateSession(userId, STATES.MAIN_MENU, {
        insuranceType: "life",
      });
      const message = `❤️ *Life Insurance*\n\nThis feature is coming soon. I'll take you back to the main menu now.`;

      LoadingWrapper._runTask(async () => {
        await new Promise((r) => setTimeout(r, 5000));
        const whatsapp = new WhatsAppService(process.env.DIALOG_360_API_KEY);
        if (process.env.TEST_MODE !== "true") {
          try {
            await whatsapp.sendMessage(userId, MessageTemplates.getMainMenu());
          } catch (e) {
            console.error(
              "Error sending main menu after coming-soon:",
              e?.response?.data || e.message
            );
          }
        } else {
          console.log(`TEST MODE: Would send main menu to ${userId}`);
        }
      });

      return { message, state: STATES.MAIN_MENU };
    }

    if (input === "5" || input.includes("property") || input.includes("home")) {
      await SessionManager.updateSession(userId, STATES.MAIN_MENU, {
        insuranceType: "property",
      });
      const message = `🏠 *Property Insurance*\n\nThis feature is coming soon. I'll take you back to the main menu now.`;

      LoadingWrapper._runTask(async () => {
        await new Promise((r) => setTimeout(r, 5000));
        const whatsapp = new WhatsAppService(process.env.DIALOG_360_API_KEY);
        if (process.env.TEST_MODE !== "true") {
          try {
            await whatsapp.sendMessage(userId, MessageTemplates.getMainMenu());
          } catch (e) {
            console.error(
              "Error sending main menu after coming-soon:",
              e?.response?.data || e.message
            );
          }
        } else {
          console.log(`TEST MODE: Would send main menu to ${userId}`);
        }
      });

      return { message, state: STATES.MAIN_MENU };
    }

    if (input === "6" || input.includes("salary") || input.includes("income")) {
      await SessionManager.updateSession(userId, STATES.MAIN_MENU, {
        insuranceType: "salary",
      });
      const message = `💰 *Salary Insurance*\n\nThis feature is coming soon. I'll take you back to the main menu now.`;

      LoadingWrapper._runTask(async () => {
        await new Promise((r) => setTimeout(r, 5000));
        const whatsapp = new WhatsAppService(process.env.DIALOG_360_API_KEY);
        if (process.env.TEST_MODE !== "true") {
          try {
            await whatsapp.sendMessage(userId, MessageTemplates.getMainMenu());
          } catch (e) {
            console.error(
              "Error sending main menu after coming-soon:",
              e?.response?.data || e.message
            );
          }
        } else {
          console.log(`TEST MODE: Would send main menu to ${userId}`);
        }
      });

      return { message, state: STATES.MAIN_MENU };
    }

    if (input === "7" || input.includes("credit") || input.includes("loan")) {
      await SessionManager.updateSession(userId, STATES.MAIN_MENU, {
        insuranceType: "credit",
      });
      const message = `💳 *Credit Insurance*\n\nThis feature is coming soon. I'll take you back to the main menu now.`;

      LoadingWrapper._runTask(async () => {
        await new Promise((r) => setTimeout(r, 5000));
        const whatsapp = new WhatsAppService(process.env.DIALOG_360_API_KEY);
        if (process.env.TEST_MODE !== "true") {
          try {
            await whatsapp.sendMessage(userId, MessageTemplates.getMainMenu());
          } catch (e) {
            console.error(
              "Error sending main menu after coming-soon:",
              e?.response?.data || e.message
            );
          }
        } else {
          console.log(`TEST MODE: Would send main menu to ${userId}`);
        }
      });

      return { message, state: STATES.MAIN_MENU };
    }

    if (input === "8" || input.includes("travel")) {
      await SessionManager.updateSession(userId, STATES.MAIN_MENU, {
        insuranceType: "travel",
      });
      const message = `✈️ *Travel Insurance*\n\nThis feature is coming soon. I'll take you back to the main menu now.`;

      LoadingWrapper._runTask(async () => {
        await new Promise((r) => setTimeout(r, 5000));
        const whatsapp = new WhatsAppService(process.env.DIALOG_360_API_KEY);
        if (process.env.TEST_MODE !== "true") {
          try {
            await whatsapp.sendMessage(userId, MessageTemplates.getMainMenu());
          } catch (e) {
            console.error(
              "Error sending main menu after coming-soon:",
              e?.response?.data || e.message
            );
          }
        } else {
          console.log(`TEST MODE: Would send main menu to ${userId}`);
        }
      });

      return { message, state: STATES.MAIN_MENU };
    }

    return {
      message: `I didn't understand that selection. Please choose a number between 1-8, or type MENU to return to the main menu.`,
      state: STATES.QUOTE_CATEGORY,
    };
  }
}
