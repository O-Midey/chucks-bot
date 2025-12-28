import { STATES } from "./config/constants.js";
import { SessionManager } from "./session/sessionManager.js";
import { MessageTemplates, isGreeting } from "./utils/messageUtils.js";

// Import ALL handlers
import { MainMenuHandler } from "./handlers/mainMenuHandler.js";
import { QuoteHandler } from "./handlers/quoteHandler.js";
import { HealthInsuranceHandler } from "./handlers/healthInsuranceHandler.js/healthHandler.js";
import { AutoInsuranceHandler } from "./handlers/autoInsuranceHandler.js";
import { DeviceInsuranceHandler } from "./handlers/deviceInsuranceHandler.js";
import { LifeInsuranceHandler } from "./handlers/lifeInsuranceHandlers.js";
import { PropertyInsuranceHandler } from "./handlers/propertyInsuranceHandler.js";
import { SalaryInsuranceHandler } from "./handlers/salaryInsuranceHandler.js";
import { CreditInsuranceHandler } from "./handlers/creditInsuranceHandler.js";
import { PaymentHandler } from "./handlers/paymentHandler.js";
import { PolicyHandler } from "./handlers/policyHandler.js";
import { ClaimsHandler } from "./handlers/claimsHandler.js";
import { LearnHandler } from "./handlers/learnHandler.js";
import { FAQHandler } from "./handlers/faqHandler.js";
import { AgentHandler } from "./handlers/agentHandler.js";

export class MessageRouter {
  static async route(userId, text) {
    // Check for session timeout
    const timeoutCheck = SessionManager.checkTimeout(userId);
    if (timeoutCheck.timedOut) {
      return {
        message: timeoutCheck.message,
        state: STATES.MAIN_MENU,
      };
    }

    // Check for greeting/restart
    if (isGreeting(text)) {
      SessionManager.clearSession(userId);
      return {
        message: MessageTemplates.getWelcome(),
        state: STATES.MAIN_MENU,
      };
    }

    const session = SessionManager.getSession(userId);
    const input = text.toLowerCase().trim();

    // Route based on current state
    try {
      switch (session.state) {
        // ============ MAIN NAVIGATION ============
        case STATES.MAIN_MENU:
          return MainMenuHandler.handle(userId, input, text);

        case STATES.QUOTE_CATEGORY:
          return QuoteHandler.handle(userId, input, text);

        // ============ HEALTH INSURANCE FLOW ============
        case STATES.HEALTH_PROVIDER_SELECT:
          return await HealthInsuranceHandler.handleProviderSelection(
            userId,
            input,
            text
          );
        case STATES.HEALTH_PLANS_LIST:
          return await HealthInsuranceHandler.handlePlanSelection(
            userId,
            input,
            text
          );
        case STATES.HEALTH_PLAN_DETAILS:
          return await HealthInsuranceHandler.handlePlanDetails(
            userId,
            input,
            text
          );

        case STATES.HEALTH_REG_SURNAME:
          return await HealthInsuranceHandler.handleSurname(
            userId,
            input,
            text
          );
        case STATES.HEALTH_REG_MIDDLENAME:
          return await HealthInsuranceHandler.handleMiddleName(
            userId,
            input,
            text
          );
        case STATES.HEALTH_REG_FIRSTNAME:
          return await HealthInsuranceHandler.handleFirstName(
            userId,
            input,
            text
          );
        case STATES.HEALTH_REG_EMAIL:
          return await HealthInsuranceHandler.handleEmail(userId, input, text);
        case STATES.HEALTH_REG_PHONE:
          return await HealthInsuranceHandler.handlePhone(userId, input, text);

        case STATES.HEALTH_REG_MARITAL:
          return await HealthInsuranceHandler.handleMaritalStatus(
            userId,
            input,
            text
          );

        case STATES.HEALTH_REG_STATE:
          return await HealthInsuranceHandler.handleState(userId, input, text);
        case STATES.HEALTH_REG_LGA:
          return await HealthInsuranceHandler.handleLGA(userId, input, text);
        case STATES.HEALTH_REG_ADDRESS:
          return await HealthInsuranceHandler.handleAddress(
            userId,
            input,
            text
          );

        case STATES.HEALTH_REVIEW:
          return await HealthInsuranceHandler.handleReview(userId, input, text);
        case STATES.HEALTH_REVIEW_EDIT:
          return await HealthInsuranceHandler.handleReviewEdit(
            userId,
            input,
            text
          );
        case STATES.HEALTH_PERSONAL_EDIT:
          return await HealthInsuranceHandler.handlePersonalEdit(
            userId,
            input,
            text
          );
        case STATES.HEALTH_PROCESSING:
          return {
            message: "⏳ Processing your request... Please wait.",
            state: STATES.HEALTH_PROCESSING,
          };

        case STATES.HEALTH_PAYMENT:
          return await HealthInsuranceHandler.handlePayment(
            userId,
            input,
            text
          );
        case STATES.HEALTH_PAYMENT_VERIFY:
          return await HealthInsuranceHandler.verifyAndActivatePolicy(userId);
        case STATES.HEALTH_POLICY_ACTIVATED:
          return HealthInsuranceHandler.handlePolicyActivated(
            userId,
            input,
            text
          );
        case STATES.HEALTH_INITIATE_ENROLLMENT:
          return await HealthInsuranceHandler.initiateKampeEnrollment(userId);

        // ============ AUTO INSURANCE FLOW ============
        case STATES.AUTO_TYPE:
          return AutoInsuranceHandler.handleType(userId, input, text);
        case STATES.AUTO_BRAND:
          return AutoInsuranceHandler.handleBrand(userId, input, text);
        case STATES.AUTO_MODEL:
          return AutoInsuranceHandler.handleModel(userId, input, text);
        case STATES.AUTO_YEAR:
          return AutoInsuranceHandler.handleYear(userId, input, text);
        case STATES.AUTO_VALUE:
          return AutoInsuranceHandler.handleValue(userId, input, text);
        case STATES.AUTO_PLANS:
          return AutoInsuranceHandler.handlePlans(userId, input, text);

        // ============ DEVICE INSURANCE FLOW ============
        case STATES.DEVICE_TYPE:
          return DeviceInsuranceHandler.handleType(userId, input, text);
        case STATES.DEVICE_BRAND:
          return DeviceInsuranceHandler.handleBrand(userId, input, text);
        case STATES.DEVICE_MODEL:
          return DeviceInsuranceHandler.handleModel(userId, input, text);
        case STATES.DEVICE_CONDITION:
          return DeviceInsuranceHandler.handleCondition(userId, input, text);
        case STATES.DEVICE_VALUE:
          return DeviceInsuranceHandler.handleValue(userId, input, text);
        case STATES.DEVICE_PLANS:
          return DeviceInsuranceHandler.handlePlans(userId, input, text);

        // ============ LIFE INSURANCE FLOW ============
        case STATES.LIFE_AGE:
          return LifeInsuranceHandler.handleAge(userId, input, text);
        case STATES.LIFE_DEPENDENTS:
          return LifeInsuranceHandler.handleDependents(userId, input, text);
        case STATES.LIFE_SUM:
          return LifeInsuranceHandler.handleSum(userId, input, text);
        case STATES.LIFE_CONDITIONS:
          return LifeInsuranceHandler.handleConditions(userId, input, text);
        case STATES.LIFE_PLANS:
          return LifeInsuranceHandler.handlePlans(userId, input, text);

        // ============ PROPERTY INSURANCE FLOW ============
        case STATES.PROPERTY_TYPE:
          return PropertyInsuranceHandler.handleType(userId, input, text);
        case STATES.PROPERTY_STATE:
          return PropertyInsuranceHandler.handleState(userId, input, text);
        case STATES.PROPERTY_VALUE:
          return PropertyInsuranceHandler.handleValue(userId, input, text);
        case STATES.PROPERTY_COVERAGE:
          return PropertyInsuranceHandler.handleCoverage(userId, input, text);
        case STATES.PROPERTY_PLANS:
          return PropertyInsuranceHandler.handlePlans(userId, input, text);

        // ============ SALARY INSURANCE FLOW ============
        case STATES.SALARY_AMOUNT:
          return SalaryInsuranceHandler.handleAmount(userId, input, text);
        case STATES.SALARY_EMPLOYMENT:
          return SalaryInsuranceHandler.handleEmployment(userId, input, text);
        case STATES.SALARY_COVERAGE:
          return SalaryInsuranceHandler.handleCoverage(userId, input, text);
        case STATES.SALARY_PLANS:
          return SalaryInsuranceHandler.handlePlans(userId, input, text);

        // ============ CREDIT INSURANCE FLOW ============
        case STATES.CREDIT_AMOUNT:
          return CreditInsuranceHandler.handleAmount(userId, input, text);
        case STATES.CREDIT_DURATION:
          return CreditInsuranceHandler.handleDuration(userId, input, text);
        case STATES.CREDIT_TYPE:
          return CreditInsuranceHandler.handleType(userId, input, text);
        case STATES.CREDIT_PLANS:
          return CreditInsuranceHandler.handlePlans(userId, input, text);

        // ============ PAYMENT FLOW ============
        case STATES.PAYMENT_METHOD:
          return PaymentHandler.handleMethod(userId, input, text);
        case STATES.PAYMENT_CONFIRMATION:
          return await HealthInsuranceHandler.handlePaymentConfirmation(
            userId,
            input,
            text
          );

        // ============ POLICY MANAGEMENT ============
        case STATES.POLICY_LOOKUP:
          return await PolicyHandler.handleLookup(userId, input, text);
        case STATES.POLICY_OPTIONS:
          return PolicyHandler.handleOptions(userId, input, text);

        // ============ CLAIMS FLOW ============
        case STATES.CLAIMS_MENU:
          return ClaimsHandler.handleMenu(userId, input, text);
        case STATES.CLAIM_TYPE:
          return ClaimsHandler.handleType(userId, input, text);
        case STATES.CLAIM_DESCRIPTION:
          return ClaimsHandler.handleDescription(userId, input, text);
        case STATES.CLAIM_LOCATION:
          return ClaimsHandler.handleLocation(userId, input, text);
        case STATES.CLAIM_DOCUMENTS:
          return await ClaimsHandler.handleDocuments(userId, input, text);
        case STATES.CLAIM_TRACKING:
          return ClaimsHandler.handleTracking(userId, input, text);

        // ============ LEARN PRODUCTS ============
        case STATES.LEARN_PRODUCTS:
          return LearnHandler.handleProducts(userId, input, text);
        case STATES.PRODUCT_DETAIL:
          return LearnHandler.handleProductDetail(userId, input, text);

        // ============ FAQ ============
        case STATES.FAQ_CATEGORY:
          return FAQHandler.handle(userId, input, text);

        // ============ AGENT CONNECTION ============
        case STATES.AGENT_CONNECT:
          return AgentHandler.handle(userId, input, text);

        // ============ DEFAULT ============
        default:
          console.warn(`Unknown state: ${session.state}`);
          return {
            message:
              "I didn't understand that. Let me show you the main menu.\n\n" +
              MessageTemplates.getMainMenu(),
            state: STATES.MAIN_MENU,
          };
      }
    } catch (error) {
      console.error("Error in message routing:", error);
      return {
        message:
          "Sorry, something went wrong. Let me show you the main menu.\n\n" +
          MessageTemplates.getMainMenu(),
        state: STATES.MAIN_MENU,
      };
    }
  }
}
