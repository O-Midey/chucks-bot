import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { MessageTemplates } from "../utils/messageUtils.js";

export class MainMenuHandler {
  static handle(userId, input, text) {
    if (input === "1" || input.includes("quote")) {
      SessionManager.updateSession(userId, STATES.QUOTE_CATEGORY);
      return {
        message: MessageTemplates.getQuoteCategories(),
        state: STATES.QUOTE_CATEGORY,
      };
    }

    if (input === "2" || input.includes("learn") || input.includes("product")) {
      SessionManager.updateSession(userId, STATES.LEARN_PRODUCTS);
      return {
        message: MessageTemplates.getLearnProducts(),
        state: STATES.LEARN_PRODUCTS,
      };
    }

    if (input === "3" || input.includes("policy") || input.includes("manage")) {
      SessionManager.updateSession(userId, STATES.POLICY_LOOKUP);
      return {
        message: `🔍 *Policy Management*

Please provide your:
• Policy number, OR
• Registered phone number

I'll look up your policy details.`,
        state: STATES.POLICY_LOOKUP,
      };
    }

    if (input === "4" || input.includes("claim") || input.includes("support")) {
      SessionManager.updateSession(userId, STATES.CLAIMS_MENU);
      return {
        message: MessageTemplates.getClaimsMenu(),
        state: STATES.CLAIMS_MENU,
      };
    }

    if (input === "5" || input.includes("faq") || input.includes("question")) {
      SessionManager.updateSession(userId, STATES.FAQ_CATEGORY);
      return {
        message: MessageTemplates.getFAQMenu(),
        state: STATES.FAQ_CATEGORY,
      };
    }

    return {
      message: `I didn't quite catch that. ${MessageTemplates.getMainMenu()}`,
      state: STATES.MAIN_MENU,
    };
  }
}
