import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { Validators } from "../utils/validationUtils.js";
import { MessageTemplates } from "../utils/messageUtils.js";

export class LifeInsuranceHandler {
  static handleAge(userId, input, text) {
    if (!Validators.isValidAge(text, 18, 100)) {
      return {
        message: "Please enter a valid age between 18 and 100.",
        state: STATES.LIFE_AGE,
      };
    }

    const age = parseInt(text);
    SessionManager.updateSession(userId, STATES.LIFE_DEPENDENTS, { age });
    return {
      message: "Do you have any dependents?\n\n1️⃣ Yes\n2️⃣ No",
      state: STATES.LIFE_DEPENDENTS,
    };
  }

  static handleDependents(userId, input, text) {
    const hasDependents = input === "1" || input.includes("yes");
    SessionManager.updateSession(userId, STATES.LIFE_SUM, { hasDependents });
    return {
      message: `What sum insured would you prefer (in Naira)?

_This is the amount your beneficiaries will receive._

Examples:
• 1000000 (₦1M)
• 5000000 (₦5M)
• 10000000 (₦10M)`,
      state: STATES.LIFE_SUM,
    };
  }

  static handleSum(userId, input, text) {
    if (!Validators.isValidAmount(text, 500000)) {
      return {
        message: "Please enter a valid amount (minimum ₦500,000)",
        state: STATES.LIFE_SUM,
      };
    }

    const sumInsured = Validators.parseAmount(text);
    SessionManager.updateSession(userId, STATES.LIFE_CONDITIONS, {
      sumInsured,
    });
    return {
      message: "Do you have any serious medical conditions?\n\n1️⃣ Yes\n2️⃣ No\n\n_This helps us provide accurate coverage._",
      state: STATES.LIFE_CONDITIONS,
    };
  }

  static async handleConditions(userId, input, text) {
    const hasConditions = input === "1" || input.includes("yes");
    SessionManager.updateSession(userId, STATES.LIFE_PLANS, { hasConditions });

    const session = await SessionManager.getSession(userId);
    const { age, hasDependents, sumInsured } = session.data;

    // Premium calculation
    const monthlyPremium = Math.round(sumInsured * 0.001 + age * 100);

    let message = "✅ *Your Life Insurance Quote*\n\n";
    message += `Age: ${age}\n`;
    message += `Dependents: ${hasDependents ? "Yes" : "No"}\n`;
    message += `Sum Insured: ₦${Validators.formatAmount(sumInsured)}\n\n`;
    message += `*Monthly Premium: ₦${Validators.formatAmount(
      monthlyPremium
    )}*\n\n`;
    message += "Coverage includes:\n";
    message += "• Death benefit payout\n";
    message += "• Terminal illness cover\n";
    message += "• Flexible premium payments\n";
    message += "• Investment options\n\n";
    message += "Would you like to proceed?\n\n";
    message += "1️⃣ Yes, buy now\n";
    message += "2️⃣ Save quote\n";
    message += "3️⃣ Back to menu";

    return { message, state: STATES.LIFE_PLANS };
  }

  static async handlePlans(userId, input, text) {
    if (input === "1" || input.includes("yes") || input.includes("buy")) {
      await SessionManager.updateSession(userId, STATES.PAYMENT_METHOD);
      const session = await SessionManager.getSession(userId);
      const { age, sumInsured } = session.data;
      const monthlyPremium = Math.round(sumInsured * 0.001 + age * 100);

      // Import PaymentHandler dynamically to avoid circular dependency
      return {
        message: `💳 *Payment Options*

Your premium: ₦${Validators.formatAmount(monthlyPremium)}/month

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
        message: "✅ Quote saved! I'll send you a reminder in 24 hours.\n\nType MENU to return to the main menu.",
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
      message: "Please select 1, 2, or 3.",
      state: STATES.LIFE_PLANS,
    };
  }
}
