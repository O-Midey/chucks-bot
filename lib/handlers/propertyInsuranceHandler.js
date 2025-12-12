import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { Validators } from "../utils/validationUtils.js";
import { MessageTemplates } from "../utils/messageUtils.js";

export class PropertyInsuranceHandler {
  static handleType(userId, input, text) {
    let propertyType = "";

    if (input === "1" || input.includes("house") || input.includes("home")) {
      propertyType = "house";
    } else if (
      input === "2" ||
      input.includes("shop") ||
      input.includes("store")
    ) {
      propertyType = "shop";
    } else if (input === "3" || input.includes("office")) {
      propertyType = "office";
    } else {
      return {
        message: `Please select:\n1️⃣ House\n2️⃣ Shop\n3️⃣ Office`,
        state: STATES.PROPERTY_TYPE,
      };
    }

    SessionManager.updateSession(userId, STATES.PROPERTY_STATE, {
      propertyType,
    });
    return {
      message: `What state is the property located in?\n\n_Example: Lagos, Abuja, etc._`,
      state: STATES.PROPERTY_STATE,
    };
  }

  static handleState(userId, input, text) {
    SessionManager.updateSession(userId, STATES.PROPERTY_VALUE, {
      propertyState: text,
    });
    return {
      message: `What is the estimated value of the property (in Naira)?\n\n_Example: 15000000_`,
      state: STATES.PROPERTY_VALUE,
    };
  }

  static handleValue(userId, input, text) {
    if (!Validators.isValidAmount(text, 500000)) {
      return {
        message: `Please enter a valid amount (e.g., 15000000)`,
        state: STATES.PROPERTY_VALUE,
      };
    }

    const value = Validators.parseAmount(text);
    SessionManager.updateSession(userId, STATES.PROPERTY_COVERAGE, {
      propertyValue: value,
    });
    return {
      message: `What coverage do you need?\n\n1️⃣ Fire only\n2️⃣ Fire & Theft\n3️⃣ Fire, Theft & Flood\n4️⃣ All-risk (Comprehensive)`,
      state: STATES.PROPERTY_COVERAGE,
    };
  }

  static handleCoverage(userId, input, text) {
    let coverage = "";
    let coverageMultiplier = 1;

    if (input === "1" || input.includes("fire only")) {
      coverage = "Fire only";
      coverageMultiplier = 0.002;
    } else if (input === "2" || input.includes("theft")) {
      coverage = "Fire & Theft";
      coverageMultiplier = 0.003;
    } else if (input === "3" || input.includes("flood")) {
      coverage = "Fire, Theft & Flood";
      coverageMultiplier = 0.004;
    } else if (
      input === "4" ||
      input.includes("all") ||
      input.includes("comprehensive")
    ) {
      coverage = "All-risk";
      coverageMultiplier = 0.005;
    } else {
      return {
        message: `Please select 1, 2, 3, or 4.`,
        state: STATES.PROPERTY_COVERAGE,
      };
    }

    SessionManager.updateSession(userId, STATES.PROPERTY_PLANS, {
      propertyCoverage: coverage,
    });

    const session = SessionManager.getSession(userId);
    const { propertyType, propertyState, propertyValue } = session.data;
    const premium = Math.round(propertyValue * coverageMultiplier);

    let message = `✅ *Your Property Insurance Quote*\n\n`;
    message += `Property Type: ${propertyType}\n`;
    message += `Location: ${propertyState}\n`;
    message += `Value: ₦${Validators.formatAmount(propertyValue)}\n`;
    message += `Coverage: ${coverage}\n\n`;
    message += `*Annual Premium: ₦${Validators.formatAmount(premium)}*\n\n`;
    message += `Would you like to proceed?\n\n`;
    message += `1️⃣ Yes, buy now\n`;
    message += `2️⃣ Save quote\n`;
    message += `3️⃣ Back to menu`;

    return { message, state: STATES.PROPERTY_PLANS };
  }

  static handlePlans(userId, input, text) {
    if (input === "1" || input.includes("yes") || input.includes("buy")) {
      SessionManager.updateSession(userId, STATES.PAYMENT_METHOD);
      const session = SessionManager.getSession(userId);
      const { propertyValue, propertyCoverage } = session.data;

      const multipliers = {
        "Fire only": 0.002,
        "Fire & Theft": 0.003,
        "Fire, Theft & Flood": 0.004,
        "All-risk": 0.005,
      };

      const premium = Math.round(
        propertyValue * (multipliers[propertyCoverage] || 0.003)
      );

      return {
        message: `💳 *Payment Options*

Your premium: ₦${Validators.formatAmount(premium)}/year

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
      state: STATES.PROPERTY_PLANS,
    };
  }
}
