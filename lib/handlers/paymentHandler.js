import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { MessageTemplates } from "../utils/messageUtils.js";
import { GlobalPayAPIService } from "../services/globalPayApiService.js";
import { LoadingWrapper } from "../utils/loadingWrapper.js";
import { WhatsAppService } from "../services/whatsappService.js";

export class PaymentHandler {
  static getPaymentOptions(userId, premium) {
    // Storing the premium in the session so it can be accessed in handleMethod
    SessionManager.updateSession(userId, STATES.PAYMENT_METHOD, { premium });
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

  static async handleMethod(userId, input, text) {
    if (input === "1" || input.includes("online") || input.includes("card")) {
      const session = SessionManager.getSession(userId);

      // NOTE: These session data points are assumptions.
      // Ensure they are set in the session in previous steps.
      const premium = session.data.premium || 25000; // Default for now
      const firstName = session.data.firstName || "John";
      const lastName = session.data.lastName || "Doe";
      const email = session.data.email || "customer@example.com";
      const phone = session.data.phone || "08012345678";
      const address = session.data.address || "123 Main St, Lagos";

      return LoadingWrapper.callWithLoading(
        userId,
        "Generating payment link...",
        async () => {
          const globalPayService = new GlobalPayAPIService();
          const merchantTransactionReference = `SKY_${userId}_${Date.now()}`;

          const paymentDetails = {
            amount: premium,
            currency: "NGN",
            customerFirstName: firstName,
            customerLastName: lastName,
            customerEmail: email,
            customerPhone: phone,
            customerAddress: address,
            merchantTransactionReference: merchantTransactionReference,
          };

          const result = await globalPayService.initiatePayment(paymentDetails);

          if (result.success && result.data.checkoutUrl) {
            SessionManager.updateSession(userId, STATES.PAYMENT_CONFIRMATION, {
              merchantTransactionReference,
            });
            const message = `💳 *Pay Online*

Click the link below to complete your payment:
${result.data.checkoutUrl}

After payment, your policy will be activated immediately.

✅ I've completed payment
❌ Cancel`;
            return { message: message, state: STATES.PAYMENT_CONFIRMATION };
          } else {
            console.error("GlobalPay Error:", result.error);
            const message =
              "Sorry, we could not generate a payment link at the moment. Please try again later or choose another payment method.";
            return { message: message, state: STATES.PAYMENT_METHOD };
          }
        }
      );
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

  // ... rest of the file is the same
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
