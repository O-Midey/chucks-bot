import { BaseStep } from "./BaseStep.js";
import { STATES } from "../../../config/constants.js";
import { KampeAPIService } from "../../../services/kampeApiService.js";
import { HealthInsuranceFormatter } from "../formatters/HealthInsuranceFormatter.js";
import { SessionManager } from "../../../session/sessionManager.js";
import { Validators } from "../../../utils/validationUtils.js";
import { PaymentLogger } from "../../../utils/paymentLogger.js";

const kampeAPI = new KampeAPIService(process.env.KAMPE_BEARER_TOKEN);

export class PaymentStep extends BaseStep {
  async processEnrollment() {
    const data = this.getSessionData();
    SessionManager.updateSession(this.userId, STATES.HEALTH_PROCESSING);

    try {
      const enrollmentData = {
        firstname: data.firstname,
        lastname: data.surname,
        middlename: data.middlename,
        phone_number: data.phone,
        user_image: "default.png",
        provider_id: data.providerId,
        sector: "1",
        state: data.stateId,
        localgovt: data.lgaId,
        marital_status: data.marital_status,
        address: data.address,
      };

      SessionManager.updateSession(this.userId, STATES.HEALTH_PROCESSING, {
        kampeEnrollmentData: enrollmentData,
        premium: data.planPremium,
        firstName: data.firstname,
        lastName: data.surname,
        email: data.email || "customer@example.com",
        phone: data.phone,
        address: data.address,
      });

      return this.initializeGlobalPayPayment(data.planPremium, data);
    } catch (error) {
      console.error(
        `[PAYMENT] Error preparing for payment for user ${this.userId}:`,
        error.message
      );
      return this.createResponse(
        `An error occurred while preparing your payment. Please try again later or contact support.`,
        STATES.MAIN_MENU
      );
    }
  }

  async initializeGlobalPayPayment(premium, data) {
    try {
      const GlobalPayAPIService = (
        await import("../../../services/globalPayApiService.js")
      ).GlobalPayAPIService;
      const globalPayService = new GlobalPayAPIService();
      const merchantTransactionReference = `HEALTH_${
        this.userId
      }_${Date.now()}`;

      const serviceCharge = Math.round(premium * 0.03);
      const totalAmount = premium + serviceCharge;

      const paymentDetails = {
        amount: totalAmount,
        currency: data.selectedPlan?.currency === "USD" ? "USD" : "NGN",
        customerFirstName: data.firstname,
        customerLastName: data.surname,
        customerEmail: data.email || `${data.phone}@temp.com`,
        customerPhone: data.phone,
        customerAddress: data.address,
        merchantTransactionReference: merchantTransactionReference,
      };

      const result = await globalPayService.initiatePayment(paymentDetails);

      if (result.success && result.data.checkoutUrl) {
        // Store total amount for later verification and payment timing info
        SessionManager.updateSession(this.userId, STATES.PAYMENT_CONFIRMATION, {
          merchantTransactionReference,
          totalAmount, // Store for amount verification during payment check
          paymentStartTime: Date.now(), // For timeout check
          paymentAttempts: 0, // For attempt limit
        });

        PaymentLogger.logInitiation(
          this.userId,
          merchantTransactionReference,
          totalAmount
        );

        const message = HealthInsuranceFormatter.formatPaymentMessage(
          premium,
          data.selectedPlan?.currency,
          result.data.checkoutUrl,
          serviceCharge
        );

        return this.createResponse(message, STATES.PAYMENT_CONFIRMATION);
      } else {
        return this.createResponse(
          `Payment initialization failed. Please try again or contact support.`,
          STATES.HEALTH_REVIEW
        );
      }
    } catch (error) {
      console.error("GlobalPay initialization error:", error);
      SessionManager.updateSession(this.userId, STATES.HEALTH_REVIEW);
      return this.createResponse(
        `Payment system error. Please try again later.`,
        STATES.HEALTH_REVIEW
      );
    }
  }

  async handlePaymentConfirmation(input) {
    if (
      input.includes("done") ||
      input.includes("paid") ||
      input.includes("completed")
    ) {
      // Check max attempts and timeout before verifying
      const session = await SessionManager.getSession(this.userId);
      const paymentAttempts = session.data.paymentAttempts || 0;
      const paymentStartTime = session.data.paymentStartTime || Date.now();
      const elapsedMinutes = (Date.now() - paymentStartTime) / (1000 * 60);

      const MAX_PAYMENT_ATTEMPTS = 5;
      const PAYMENT_TIMEOUT_MINUTES = 15;

      if (paymentAttempts >= MAX_PAYMENT_ATTEMPTS) {
        await SessionManager.updateSession(this.userId, STATES.MAIN_MENU);
        PaymentLogger.logPaymentLimitExceeded(this.userId, "max_attempts", {
          attempts: paymentAttempts,
          max: MAX_PAYMENT_ATTEMPTS,
        });
        return this.createResponse(
          `❌ You have exceeded the maximum number of payment verification attempts (${MAX_PAYMENT_ATTEMPTS}).\n\nPlease contact support or try again later.\n\nType MENU to return to main menu.`,
          STATES.MAIN_MENU
        );
      }

      if (elapsedMinutes > PAYMENT_TIMEOUT_MINUTES) {
        await SessionManager.updateSession(this.userId, STATES.MAIN_MENU);
        PaymentLogger.logPaymentLimitExceeded(this.userId, "timeout", {
          elapsedMinutes,
          maxMinutes: PAYMENT_TIMEOUT_MINUTES,
        });
        return this.createResponse(
          `❌ Your payment session has expired (timeout after ${PAYMENT_TIMEOUT_MINUTES} minutes).\n\nPlease start the registration process again.\n\nType MENU to return to main menu.`,
          STATES.MAIN_MENU
        );
      }

      // Increment attempt counter
      await SessionManager.updateSession(
        this.userId,
        STATES.PAYMENT_CONFIRMATION,
        {
          paymentAttempts: paymentAttempts + 1,
          paymentStartTime,
        }
      );

      return this.verifyGlobalPayPayment();
    }

    if (input.includes("cancel") || input === "menu") {
      SessionManager.clearSession(this.userId);
      return this.createResponse(
        `Payment cancelled. Your registration has been cancelled.\n\nType MENU to return to main menu.`,
        STATES.MAIN_MENU
      );
    }

    return this.createResponse(
      `Please complete your payment using the link provided, then reply "DONE" to verify.\n\n_Type "CANCEL" to cancel payment and return to main menu._`,
      STATES.PAYMENT_CONFIRMATION
    );
  }

  async verifyGlobalPayPayment() {
    const session = await SessionManager.getSession(this.userId);
    const merchantTransactionReference =
      session.data.merchantTransactionReference;

    if (!merchantTransactionReference) {
      SessionManager.updateSession(this.userId, STATES.HEALTH_REVIEW);
      return this.createResponse(
        `Payment reference not found. Please try the payment process again.`,
        STATES.HEALTH_REVIEW
      );
    }

    try {
      const GlobalPayAPIService = (
        await import("../../../services/globalPayApiService.js")
      ).GlobalPayAPIService;
      const globalPayService = new GlobalPayAPIService();

      const verificationResult = await globalPayService.verifyPayment(
        merchantTransactionReference
      );

      // Extract the amount paid and expected amount from session
      const expectedAmount = session.data.totalAmount;
      const paidAmount =
        verificationResult.data?.amount || verificationResult.data?.paidAmount;

      const isSuccessful =
        verificationResult.success &&
        (verificationResult.data.status === "successful" ||
          verificationResult.data.status === "success" ||
          verificationResult.data.status === "completed" ||
          verificationResult.data.paymentStatus === "successful" ||
          verificationResult.data.paid === true) &&
        paidAmount === expectedAmount; // CRITICAL: Verify amount matches

      if (isSuccessful) {
        PaymentLogger.logVerification(
          merchantTransactionReference,
          true,
          verificationResult.data.status,
          paidAmount === expectedAmount
        );
        return this.initiateKampeEnrollment();
      } else {
        PaymentLogger.logVerification(
          merchantTransactionReference,
          false,
          verificationResult.data?.status,
          paidAmount === expectedAmount
        );
        console.log(`[PAYMENT] Verification failed for user ${this.userId}`);
        return this.createResponse(
          `❌ Payment not confirmed yet. Please ensure you've completed payment and try again.\n\nReply "DONE" to check again.`,
          STATES.PAYMENT_CONFIRMATION
        );
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      SessionManager.updateSession(this.userId, STATES.MAIN_MENU);
      return this.createResponse(
        `Error verifying payment. Please contact support with reference: ${merchantTransactionReference}`,
        STATES.MAIN_MENU
      );
    }
  }

  async initiateKampeEnrollment() {
    const session = await SessionManager.getSession(this.userId);
    const kampeEnrollmentData = session.data.kampeEnrollmentData;

    if (!kampeEnrollmentData) {
      SessionManager.updateSession(this.userId, STATES.MAIN_MENU);
      return this.createResponse(
        `Enrollment data not found. Please contact support.`,
        STATES.MAIN_MENU
      );
    }

    try {
      console.log("⏳ Processing Kampe enrollment...");
      const enrollmentResult = await kampeAPI.createEnrollment(
        kampeEnrollmentData
      );

      if (enrollmentResult.message === "Successfully created user!") {
        SessionManager.clearSession(this.userId);

        let message = `✅ *Health Insurance Registration Complete!*\n\n`;
        message += `🎉 Your health insurance policy has been successfully created!\n\n`;
        message += `📋 *Registration Details:*\n`;
        message += `Name: ${kampeEnrollmentData.firstname} ${
          kampeEnrollmentData.middlename || ""
        } ${kampeEnrollmentData.lastname}\n`;
        message += `Provider ID: ${kampeEnrollmentData.provider_id}\n`;
        message += `Location: ${session.data.lga}, ${session.data.state}\n\n`;
        message += `You will receive confirmation details shortly.\n\n`;
        message += `Type MENU to return to main menu.`;

        return this.createResponse(message, STATES.MAIN_MENU);
      } else {
        SessionManager.updateSession(this.userId, STATES.MAIN_MENU);
        return this.createResponse(
          `Registration failed: ${
            enrollmentResult.message || enrollmentResult.error
          }\n\nPlease contact support.`,
          STATES.MAIN_MENU
        );
      }
    } catch (error) {
      console.error("Kampe enrollment error:", error);
      SessionManager.updateSession(this.userId, STATES.MAIN_MENU);
      return this.createResponse(
        `An error occurred during registration. Please contact support.`,
        STATES.MAIN_MENU
      );
    }
  }
}
