import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { MessageTemplates } from "../utils/messageUtils.js";
import { GlobalPayAPIService } from "../services/globalPayApiService.js";
import { LoadingWrapper } from "../utils/loadingWrapper.js";
import { WhatsAppService } from "../services/whatsappService.js";

export class PaymentHandler {
  static async getPaymentOptions(userId, premium) {
    const session = SessionManager.getSession(userId);

    // Retrieve customer details from session (set in HealthInsuranceHandler.processEnrollment)
    const firstName = session.data.firstName;
    const lastName = session.data.lastName;
    const email = session.data.email;
    const phone = session.data.phone;
    const address = session.data.address;

    const missingFields = [];
    if (!premium) missingFields.push("premium amount");
    if (!firstName) missingFields.push("first name");
    if (!lastName) missingFields.push("last name");
    if (!email) missingFields.push("email");
    if (!phone) missingFields.push("phone number");
    if (!address) missingFields.push("address");

    if (missingFields.length > 0) {
      return {
        message: `It looks like we're missing some information to process your payment. Please provide your ${missingFields.join(", ")}.`,
        state: STATES.MAIN_MENU, // Or a more appropriate state to collect missing info
      };
    }

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
          const message = `💳 *Complete Your Payment*

Click the link below to securely complete your payment:
${result.data.checkoutUrl}

After payment, please reply with "PAID" to confirm and proceed with your registration.
❌ Cancel`;
          return { message: message, state: STATES.PAYMENT_CONFIRMATION };
        } else {
          console.error("GlobalPay Error:", result.error);
          const message =
            "Sorry, we could not generate a payment link at the moment. Please try again later or contact support.";
          return { message: message, state: STATES.MAIN_MENU }; // Go back to main menu on error
        }
      }
    );
  }

  static async handleMethod(userId, input, text) {
    // The "1️⃣ Pay Online" option is now handled directly by getPaymentOptions.
    // This method will only handle alternative payment options or error states if returned to PAYMENT_METHOD state.
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
      const session = SessionManager.getSession(userId);

      // Check if this payment was for a health insurance enrollment
      if (session.data.kampeEnrollmentData) {
        // Clear session data that's not needed for enrollment
        SessionManager.updateSession(userId, STATES.HEALTH_INITIATE_ENROLLMENT, {
            kampeEnrollmentData: session.data.kampeEnrollmentData,
            // Preserve merchantTransactionReference if it was stored
            merchantTransactionReference: session.data.merchantTransactionReference
        });

        return {
          message: `✅ Payment confirmed. Now processing your health insurance enrollment...`,
          state: STATES.HEALTH_INITIATE_ENROLLMENT,
        };
      } else {
        // Existing logic for other payments
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
