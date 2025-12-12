import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { MessageTemplates } from "../utils/messageUtils.js";

export class PaymentHandler {
  static getPaymentOptions(userId, premium) {
    return {
      message: `💳 *Payment Options*

Your premium: ₦${premium}

How would you like to pay?

1️⃣ Pay Online (Card/Bank)
2️⃣ Bank Transfer
3️⃣ USSD

_Select your preferred payment method._`,
      state: STATES.PAYMENT_METHOD,
    };
  }

  static handleMethod(userId, input, text) {
    if (input === "1" || input.includes("online") || input.includes("card")) {
      const paymentLink = "https://pay.skydd.com/xxxxx";
      SessionManager.updateSession(userId, STATES.PAYMENT_CONFIRMATION);
      return {
        message: `💳 *Pay Online*

Click the link below to complete your payment:
${paymentLink}

After payment, your policy will be activated immediately.

✅ I've completed payment
❌ Cancel`,
        state: STATES.PAYMENT_CONFIRMATION,
      };
    }

    if (input === "2" || input.includes("transfer")) {
      SessionManager.updateSession(userId, STATES.PAYMENT_CONFIRMATION);
      return {
        message: `🏦 *Bank Transfer*

Transfer to:
Bank: GTBank
Account: 0123456789
Name: Skydd Insurance Ltd

After transfer, please reply with:
"PAID" + your transaction reference

Or upload proof of payment.`,
        state: STATES.PAYMENT_CONFIRMATION,
      };
    }

    if (input === "3" || input.includes("ussd")) {
      SessionManager.updateSession(userId, STATES.PAYMENT_CONFIRMATION);
      return {
        message: `📱 *USSD Payment*

Dial: *737*50*Amount*AccountNumber#

Example: *737*50*25000*0123456789#

After payment, reply "DONE"`,
        state: STATES.PAYMENT_CONFIRMATION,
      };
    }

    return {
      message: `Please select 1, 2, or 3.`,
      state: STATES.PAYMENT_METHOD,
    };
  }

  static handleConfirmation(userId, input, text) {
    if (
      input.includes("paid") ||
      input.includes("done") ||
      input.includes("completed")
    ) {
      const policyNumber = "SKY" + Date.now().toString().slice(-8);
      const effectiveDate = new Date().toLocaleDateString();

      SessionManager.clearSession(userId);

      return {
        message: `🎉 *Payment Successful!*

Your policy is now active!

📋 *Policy Details:*
Policy Number: ${policyNumber}
Effective Date: ${effectiveDate}

📄 Your policy document has been sent to your email.

*What's Next?*
• Download your policy certificate
• Add beneficiaries (for life insurance)
• Contact us anytime for support

Type MENU for more options or HELP for assistance.`,
        state: STATES.MAIN_MENU,
      };
    }

    if (input.includes("cancel")) {
      SessionManager.updateSession(userId, STATES.MAIN_MENU);
      return {
        message: `Payment cancelled. ${MessageTemplates.getMainMenu()}`,
        state: STATES.MAIN_MENU,
      };
    }

    return {
      message: `Please reply with "PAID" after completing payment, or "CANCEL" to go back.`,
      state: STATES.PAYMENT_CONFIRMATION,
    };
  }
}
