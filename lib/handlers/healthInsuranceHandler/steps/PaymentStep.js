import { BaseStep } from "./BaseStep.js";
import { STATES } from "../../../config/constants.js";
import { KampeAPIService } from "../../../services/kampeApiService.js";
import { HealthInsuranceFormatter } from "../formatters/HealthInsuranceFormatter.js";
import { SessionManager } from "../../../session/sessionManager.js";
import { Validators } from "../../../utils/validationUtils.js";

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
      console.error("Error preparing for GlobalPay payment:", error);
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
        SessionManager.updateSession(this.userId, STATES.PAYMENT_CONFIRMATION, {
          merchantTransactionReference,
        });

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
    const session = SessionManager.getSession(this.userId);
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

      const isSuccessful =
        verificationResult.success &&
        (verificationResult.data.status === "successful" ||
          verificationResult.data.status === "success" ||
          verificationResult.data.status === "completed" ||
          verificationResult.data.paymentStatus === "successful" ||
          verificationResult.data.paid === true);

      if (isSuccessful) {
        return this.initiateKampeEnrollment();
      } else {
        console.log("Payment verification response:", verificationResult.data);
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
    const session = SessionManager.getSession(this.userId);
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
