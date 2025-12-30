import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { Validators } from "../utils/validationUtils.js";
import { MessageTemplates } from "../utils/messageUtils.js";

export class AutoInsuranceHandler {
  static handleType(userId, input, text) {
    let autoType = "";

    if (input === "1" || input.includes("comprehensive")) {
      autoType = "comprehensive";
    } else if (
      input === "2" ||
      input.includes("third") ||
      input.includes("party")
    ) {
      autoType = "third-party";
    } else if (
      input === "3" ||
      input.includes("fleet") ||
      input.includes("business")
    ) {
      autoType = "fleet";
    } else {
      return {
        message: `Please select:\n1️⃣ Comprehensive\n2️⃣ Third-party\n3️⃣ Fleet (Business)`,
        state: STATES.AUTO_TYPE,
      };
    }

    SessionManager.updateSession(userId, STATES.AUTO_BRAND, { autoType });
    return {
      message: `What is your vehicle brand?\n\n_Examples: Toyota, Honda, Mercedes, etc._`,
      state: STATES.AUTO_BRAND,
    };
  }

  static handleBrand(userId, input, text) {
    SessionManager.updateSession(userId, STATES.AUTO_MODEL, {
      autoBrand: text,
    });
    return {
      message: `What is the vehicle model?\n\n_Examples: Camry, Accord, C-Class, etc._`,
      state: STATES.AUTO_MODEL,
    };
  }

  static handleModel(userId, input, text) {
    SessionManager.updateSession(userId, STATES.AUTO_YEAR, { autoModel: text });
    return {
      message: `What year was the vehicle manufactured?\n\n_Example: 2020_`,
      state: STATES.AUTO_YEAR,
    };
  }

  static handleYear(userId, input, text) {
    if (!Validators.isValidYear(text)) {
      return {
        message: `Please enter a valid year (e.g., 2020)`,
        state: STATES.AUTO_YEAR,
      };
    }

    const year = parseInt(text);
    SessionManager.updateSession(userId, STATES.AUTO_VALUE, { autoYear: year });
    return {
      message: `What is the estimated value of your vehicle (in Naira)?\n\n_Example: 5000000_`,
      state: STATES.AUTO_VALUE,
    };
  }

  static async handleValue(userId, input, text) {
    if (!Validators.isValidAmount(text, 100000)) {
      return {
        message: `Please enter a valid amount (e.g., 5000000)`,
        state: STATES.AUTO_VALUE,
      };
    }

    const value = Validators.parseAmount(text);
    SessionManager.updateSession(userId, STATES.AUTO_PLANS, {
      autoValue: value,
    });

    const session = await SessionManager.getSession(userId);
    const { autoType, autoBrand, autoModel, autoYear } = session.data;
    const premium = Math.round(value * 0.05);

    let message = `✅ *Your Auto Insurance Quote*\n\n`;
    message += `Vehicle: ${autoYear} ${autoBrand} ${autoModel}\n`;
    message += `Type: ${autoType}\n`;
    message += `Value: ₦${Validators.formatAmount(value)}\n\n`;
    message += `*Annual Premium: ₦${Validators.formatAmount(premium)}*\n\n`;
    message += `Coverage includes:\n`;
    message += `• Accident damage\n`;
    message += `• Fire & theft\n`;
    message += `• Third-party liability\n`;
    message += `• Roadside assistance\n`;
    message += `• Access to certified workshops\n\n`;
    message += `Would you like to proceed?\n\n`;
    message += `1️⃣ Yes, buy now\n`;
    message += `2️⃣ Save quote\n`;
    message += `3️⃣ Back to menu`;

    return { message, state: STATES.AUTO_PLANS };
  }

  static async handlePlans(userId, input, text) {
    if (input === "1" || input.includes("yes") || input.includes("buy")) {
      await SessionManager.updateSession(userId, STATES.PAYMENT_METHOD);
      const session = await SessionManager.getSession(userId);
      const premium = Validators.formatAmount(
        Math.round(session.data.autoValue * 0.05)
      );

      return {
        message: `💳 *Payment Options*

Your premium: ₦${premium}/year

How would you like to pay?

1️⃣ Pay Online (Card/Bank)
2️⃣ Bank Transfer
3️⃣ USSD

_Select your preferred payment method._`,
        state: STATES.PAYMENT_METHOD,
      };
    }

    if (input === "2" || input.includes("save")) {
      return {
        message: `✅ Quote saved! I'll send you a reminder in 24 hours.\n\nType MENU to return to the main menu.`,
        state: STATES.MAIN_MENU,
      };
    }

    if (input === "3" || input.includes("menu")) {
      SessionManager.updateSession(userId, STATES.MAIN_MENU);
      return {
        message: MessageTemplates.getMainMenu(),
        state: STATES.MAIN_MENU,
      };
    }

    return {
      message: `Please select 1, 2, or 3.`,
      state: STATES.AUTO_PLANS,
    };
  }
}
