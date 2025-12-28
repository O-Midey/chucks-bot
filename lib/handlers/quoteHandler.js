import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { HealthInsuranceHandler } from "./healthInsuranceHandler.js/healthHandler.js";

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
      SessionManager.updateSession(userId, STATES.AUTO_TYPE, {
        insuranceType: "auto",
      });
      return {
        message: `🚗 *Auto Insurance Quote*

What type of auto insurance do you want?

1️⃣ Comprehensive
2️⃣ Third-party
3️⃣ Fleet (Business)

_Please select an option._`,
        state: STATES.AUTO_TYPE,
      };
    }

    if (
      input === "3" ||
      input.includes("device") ||
      input.includes("phone") ||
      input.includes("gadget")
    ) {
      SessionManager.updateSession(userId, STATES.DEVICE_TYPE, {
        insuranceType: "device",
      });
      return {
        message: `📱 *Device Insurance Quote*

What device do you want to insure?

1️⃣ Phone
2️⃣ Laptop
3️⃣ Tablet

_Please select an option._`,
        state: STATES.DEVICE_TYPE,
      };
    }

    if (input === "4" || input.includes("life")) {
      SessionManager.updateSession(userId, STATES.LIFE_AGE, {
        insuranceType: "life",
      });
      return {
        message: `❤️ *Life Insurance Quote*

What is your age?

_Please enter your age in years._`,
        state: STATES.LIFE_AGE,
      };
    }

    if (input === "5" || input.includes("property") || input.includes("home")) {
      SessionManager.updateSession(userId, STATES.PROPERTY_TYPE, {
        insuranceType: "property",
      });
      return {
        message: `🏠 *Property Insurance Quote*

What type of property do you want to insure?

1️⃣ House
2️⃣ Shop
3️⃣ Office

_Please select an option._`,
        state: STATES.PROPERTY_TYPE,
      };
    }

    if (input === "6" || input.includes("salary") || input.includes("income")) {
      SessionManager.updateSession(userId, STATES.SALARY_AMOUNT, {
        insuranceType: "salary",
      });
      return {
        message: `💰 *Salary Insurance Quote*

What is your monthly salary (in Naira)?

_Example: 150000_`,
        state: STATES.SALARY_AMOUNT,
      };
    }

    if (input === "7" || input.includes("credit") || input.includes("loan")) {
      SessionManager.updateSession(userId, STATES.CREDIT_AMOUNT, {
        insuranceType: "credit",
      });
      return {
        message: `💳 *Credit Insurance Quote*

What is your loan amount (in Naira)?

_Example: 500000_`,
        state: STATES.CREDIT_AMOUNT,
      };
    }

    if (input === "8" || input.includes("travel")) {
      return {
        message: `✈️ *Travel Insurance*

Travel insurance is launching soon! 🎉

Would you like to join the early-access list?

1️⃣ Yes, notify me
2️⃣ No, thanks
3️⃣ Back to menu

_Type MENU anytime to return to the main menu._`,
        state: STATES.QUOTE_CATEGORY,
      };
    }

    return {
      message: `I didn't understand that selection. Please choose a number between 1-8, or type MENU to return to the main menu.`,
      state: STATES.QUOTE_CATEGORY,
    };
  }
}
