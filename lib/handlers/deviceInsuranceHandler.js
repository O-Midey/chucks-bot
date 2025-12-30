import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { Validators } from "../utils/validationUtils.js";
import { MessageTemplates } from "../utils/messageUtils.js";

export class DeviceInsuranceHandler {
  static handleType(userId, input, text) {
    let deviceType = "";

    if (input === "1" || input.includes("phone")) {
      deviceType = "phone";
    } else if (input === "2" || input.includes("laptop")) {
      deviceType = "laptop";
    } else if (input === "3" || input.includes("tablet")) {
      deviceType = "tablet";
    } else {
      return {
        message: `Please select:\n1️⃣ Phone\n2️⃣ Laptop\n3️⃣ Tablet`,
        state: STATES.DEVICE_TYPE,
      };
    }

    SessionManager.updateSession(userId, STATES.DEVICE_BRAND, { deviceType });
    return {
      message: `What is the brand of your ${deviceType}?\n\n_Examples: Apple, Samsung, HP, Dell, etc._`,
      state: STATES.DEVICE_BRAND,
    };
  }

  static handleBrand(userId, input, text) {
    SessionManager.updateSession(userId, STATES.DEVICE_MODEL, {
      deviceBrand: text,
    });
    return {
      message: `What is the model?\n\n_Examples: iPhone 14, Galaxy S23, MacBook Pro, etc._`,
      state: STATES.DEVICE_MODEL,
    };
  }

  static handleModel(userId, input, text) {
    SessionManager.updateSession(userId, STATES.DEVICE_CONDITION, {
      deviceModel: text,
    });
    return {
      message: `Is your device new or used?\n\n1️⃣ New\n2️⃣ Used`,
      state: STATES.DEVICE_CONDITION,
    };
  }

  static handleCondition(userId, input, text) {
    const condition = input === "1" || input.includes("new") ? "new" : "used";
    SessionManager.updateSession(userId, STATES.DEVICE_VALUE, {
      deviceCondition: condition,
    });
    return {
      message: `How much did the device cost (in Naira)?\n\n_Example: 350000_`,
      state: STATES.DEVICE_VALUE,
    };
  }

  static async handleValue(userId, input, text) {
    if (!Validators.isValidAmount(text, 10000)) {
      return {
        message: `Please enter a valid amount (e.g., 350000)`,
        state: STATES.DEVICE_VALUE,
      };
    }

    const value = Validators.parseAmount(text);
    SessionManager.updateSession(userId, STATES.DEVICE_PLANS, {
      deviceValue: value,
    });

    const session = await SessionManager.getSession(userId);
    const { deviceType, deviceBrand, deviceModel, deviceCondition } =
      session.data;
    const premium = Math.round(value * 0.08);

    let message = `✅ *Your Device Insurance Quote*\n\n`;
    message += `Device: ${deviceBrand} ${deviceModel}\n`;
    message += `Type: ${deviceType}\n`;
    message += `Condition: ${deviceCondition}\n`;
    message += `Value: ₦${Validators.formatAmount(value)}\n\n`;
    message += `*Annual Premium: ₦${Validators.formatAmount(premium)}*\n\n`;
    message += `Coverage includes:\n`;
    message += `• Screen damage\n`;
    message += `• Theft protection\n`;
    message += `• Liquid damage\n`;
    message += `• Worldwide coverage\n\n`;
    message += `Would you like to proceed?\n\n`;
    message += `1️⃣ Yes, buy now\n`;
    message += `2️⃣ Save quote\n`;
    message += `3️⃣ Back to menu`;

    return { message, state: STATES.DEVICE_PLANS };
  }

  static async handlePlans(userId, input, text) {
    if (input === "1" || input.includes("yes") || input.includes("buy")) {
      await SessionManager.updateSession(userId, STATES.PAYMENT_METHOD);
      const session = await SessionManager.getSession(userId);
      const premium = Validators.formatAmount(
        Math.round(session.data.deviceValue * 0.08)
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
      state: STATES.DEVICE_PLANS,
    };
  }
}
