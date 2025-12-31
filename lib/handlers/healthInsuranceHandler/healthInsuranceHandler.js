import { STATES } from "../../config/constants.js";
import { SessionManager } from "../../session/sessionManager.js";
import { PlanSelectionStep } from "./steps/PlanSelectionStep.js";
import { PersonalInfoStep } from "./steps/PersonalInfoStep.js";
import { LocationStep } from "./steps/LocationStep.js";
import { ProviderSelectionStep } from "./steps/ProviderSelectionStep.js";
import ReviewStep from "./steps/ReviewStep.js";
import { PaymentStep } from "./steps/PaymentStep.js";
import { NavigationManager } from "./navigation/NavigationManager.js";

export class HealthInsuranceHandler {
  // Session validation helper
  static async validateSession(userId, expectedState) {
    const session = await SessionManager.getSession(userId);

    // Check if session was reset to MAIN_MENU but we're expecting a different state
    if (
      session.state === STATES.MAIN_MENU &&
      expectedState !== STATES.MAIN_MENU
    ) {
      // Only show expired message if this is NOT a fresh session
      if (
        !session.isNew &&
        (!session.data || Object.keys(session.data).length === 0)
      ) {
        return {
          isValid: false,
          message: "⚠️ *Session Expired*\n\nYour session has expired or been cleared. Your progress has been lost for security reasons.\n\nType MENU to start over.",
          state: STATES.MAIN_MENU,
        };
      }
    }

    return { isValid: true };
  }

  // Main entry point - show plans
  static async showPlans(userId) {
    const planStep = new PlanSelectionStep(userId);
    return await planStep.showPlans();
  }

  // Route to appropriate handler based on state
  static async handle(userId, input, text, currentState) {
    // Validate session first
    const validation = await this.validateSession(userId, currentState);
    if (!validation.isValid) {
      return validation;
    }

    // Check for global navigation commands first
    const globalResponse = await NavigationManager.handleGlobalCommands(
      userId,
      input,
      currentState
    );
    if (globalResponse) return globalResponse;

    // Route to appropriate step handler
    switch (currentState) {
    // Plan Selection
    case STATES.HEALTH_PLANS_LIST:
      return new PlanSelectionStep(userId).handlePlanSelection(input, text);

    case STATES.HEALTH_PLAN_DETAILS:
      return new PlanSelectionStep(userId).handlePlanSelection(input, text);

      // Personal Information
    case STATES.HEALTH_REG_SURNAME:
      return new PersonalInfoStep(userId).handleSurname(input, text);

    case STATES.HEALTH_REG_MIDDLENAME:
      return new PersonalInfoStep(userId).handleMiddleName(input, text);

    case STATES.HEALTH_REG_FIRSTNAME:
      return new PersonalInfoStep(userId).handleFirstName(input, text);

    case STATES.HEALTH_REG_EMAIL:
      return new PersonalInfoStep(userId).handleEmail(input, text);

    case STATES.HEALTH_REG_PHONE:
      return new PersonalInfoStep(userId).handlePhone(input, text);

    case STATES.HEALTH_REG_MARITAL:
      return new PersonalInfoStep(userId).handleMaritalStatus(input);

      // Location
    case STATES.HEALTH_REG_STATE:
      return new LocationStep(userId).handleState(input, text);

    case STATES.HEALTH_REG_LGA:
      return new LocationStep(userId).handleLGA(input, text);

    case STATES.HEALTH_REG_ADDRESS:
      return new LocationStep(userId).handleAddress(input, text);

      // Provider Selection
    case STATES.HEALTH_PROVIDER_SELECT:
      return new ProviderSelectionStep(userId).handleProviderSelection(
        input,
        text
      );

      // Review & Edit
    case STATES.HEALTH_REVIEW:
      return new ReviewStep(userId).handleReview(input);

    case STATES.HEALTH_REVIEW_EDIT:
      return new ReviewStep(userId).handleReviewEdit(input);

    case STATES.HEALTH_PERSONAL_EDIT:
      return new ReviewStep(userId).handlePersonalEdit(input);

      // Payment
    case STATES.PAYMENT_CONFIRMATION:
      return new PaymentStep(userId).handlePaymentConfirmation(input);

    default:
      return {
        message: "Invalid state. Type MENU to return to main menu.",
        state: STATES.MAIN_MENU,
      };
    }
  }

  // Backward compatibility methods
  static async handlePlanDetails(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_PLAN_DETAILS);
  }

  static async handlePlanSelection(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_PLANS_LIST);
  }

  static async handleSurname(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_REG_SURNAME);
  }

  static async handleMiddleName(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_REG_MIDDLENAME);
  }

  static async handleFirstName(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_REG_FIRSTNAME);
  }

  static async handleEmail(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_REG_EMAIL);
  }

  static async handlePhone(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_REG_PHONE);
  }

  static async handleMaritalStatus(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_REG_MARITAL);
  }

  static async handleState(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_REG_STATE);
  }

  static async handleLGA(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_REG_LGA);
  }

  static async handleAddress(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_REG_ADDRESS);
  }

  static async handleProviderSelection(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_PROVIDER_SELECT);
  }

  static async handleReview(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_REVIEW);
  }

  static async handleReviewEdit(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_REVIEW_EDIT);
  }

  static async handlePersonalEdit(userId, input, text) {
    return this.handle(userId, input, text, STATES.HEALTH_PERSONAL_EDIT);
  }

  static async handlePaymentConfirmation(userId, input, text) {
    return this.handle(userId, input, text, STATES.PAYMENT_CONFIRMATION);
  }
}
