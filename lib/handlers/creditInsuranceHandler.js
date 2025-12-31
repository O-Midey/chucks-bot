import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { Validators } from "../utils/validationUtils.js";
import { MessageTemplates } from "../utils/messageUtils.js";

export class CreditInsuranceHandler {
  static handleAmount(userId, input, text) {
    if (!Validators.isValidAmount(text, 100000)) {
      return {
        message: "Please enter a valid loan amount (e.g., 500000)",
        state: STATES.CREDIT_AMOUNT,
      };
    }

    const amount = Validators.parseAmount(text);
    SessionManager.updateSession(userId, STATES.CREDIT_DURATION, {
      creditAmount: amount,
    });
    return {
      message: "What is the loan duration (in months)?\n\n_Example: 12, 24, 36, etc._",
      state: STATES.CREDIT_DURATION,
    };
  }

  static handleDuration(userId, input, text) {
    if (!Validators.isValidDuration(text)) {
      return {
        message: "Please enter a valid duration between 3 and 120 months.",
        state: STATES.CREDIT_DURATION,
      };
    }

    const duration = parseInt(text);
    SessionManager.updateSession(userId, STATES.CREDIT_TYPE, {
      creditDuration: duration,
    });
    return {
      message: "What type of loan is this?\n\n1️⃣ Personal loan\n2️⃣ Business loan\n3️⃣ Mortgage",
      state: STATES.CREDIT_TYPE,
    };
  }

  static async handleType(userId, input, text) {
    let loanType = "";

    if (input === "1" || input.includes("personal")) {
      loanType = "Personal";
    } else if (input === "2" || input.includes("business")) {
      loanType = "Business";
    } else if (input === "3" || input.includes("mortgage")) {
      loanType = "Mortgage";
    } else {
      return {
        message: "Please select 1, 2, or 3.",
        state: STATES.CREDIT_TYPE,
      };
    }

    await SessionManager.updateSession(userId, STATES.CREDIT_PLANS, {
      loanType,
    });

    const session = await SessionManager.getSession(userId);
    const { creditAmount, creditDuration } = session.data;

    const totalPremium = Math.round(creditAmount * 0.02);
    const monthlyPremium = Math.round(totalPremium / creditDuration);

    let message = "✅ *Your Credit Insurance Quote*\n\n";
    message += `Loan Amount: ₦${Validators.formatAmount(creditAmount)}\n`;
    message += `Duration: ${creditDuration} months\n`;
    message += `Type: ${loanType}\n\n`;
    message += `*Monthly Premium: ₦${Validators.formatAmount(
      monthlyPremium
    )}*\n`;
    message += `Total Premium: ₦${Validators.formatAmount(totalPremium)}\n\n`;
    message += "Coverage includes:\n";
    message += "• Death benefit\n";
    message += "• Disability cover\n";
    message += "• Job loss protection\n\n";
    message += "Would you like to proceed?\n\n";
    message += "1️⃣ Yes, buy now\n";
    message += "2️⃣ Save quote\n";
    message += "3️⃣ Back to menu";

    return { message, state: STATES.CREDIT_PLANS };
  }

  static async handlePlans(userId, input, text) {
    if (input === "1" || input.includes("yes") || input.includes("buy")) {
      await SessionManager.updateSession(userId, STATES.PAYMENT_METHOD);
      const session = await SessionManager.getSession(userId);
      const { creditAmount, creditDuration } = session.data;
      const monthlyPremium = Math.round((creditAmount * 0.02) / creditDuration);

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
      state: STATES.CREDIT_PLANS,
    };
  }
}
