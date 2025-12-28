import { STATES } from "../../../config/constants.js";
import { StateManager } from "../../../utils/stateManager.js";
import { HealthInsuranceFormatter } from "../formatters/HealthInsuranceFormatter.js";
import { BaseStep } from "./BaseStep.js";

export default class ReviewStep extends BaseStep {
  showReviewSummary() {
    const data = this.getSessionData();
    const message = HealthInsuranceFormatter.formatReviewSummary(data);
    return this.createResponse(message, STATES.HEALTH_REVIEW);
  }

  async handleReview(input) {
    if (input === "1" || input.includes("confirm")) {
      const PaymentStep = (await import("./PaymentStep.js")).PaymentStep;
      return new PaymentStep(this.userId).processEnrollment();
    }

    if (input === "2" || input.includes("edit")) {
      return StateManager.updateAndReturn(
        this.userId,
        STATES.HEALTH_REVIEW_EDIT,
        `What would you like to edit?\n\n1️⃣ Personal Information\n2️⃣ Marital Status\n3️⃣ Location\n4️⃣ Home Address\n5️⃣ Healthcare Provider\n6️⃣ Cancel Edit`
      );
    }

    if (input === "3" || input.includes("cancel")) {
      return StateManager.clearAndReturnToMenu(
        this.userId,
        `Enrollment cancelled. Type MENU to return to main menu.`
      );
    }

    return this.createResponse(
      `Please select 1, 2, or 3.`,
      STATES.HEALTH_REVIEW
    );
  }

  async handleReviewEdit(input) {
    const editOptions = {
      1: "PERSONAL_INFO",
      2: STATES.HEALTH_REG_MARITAL,
      3: STATES.HEALTH_REG_STATE,
      4: STATES.HEALTH_REG_ADDRESS,
      5: STATES.HEALTH_PROVIDER_SELECT,
    };

    const nextAction = editOptions[input];

    if (!nextAction) {
      if (input === "6" || input.includes("cancel")) {
        return StateManager.updateAndReturn(
          this.userId,
          STATES.HEALTH_REVIEW,
          this.showReviewSummary().message
        );
      }
      return this.createResponse(
        `Please select a valid option (1-6).`,
        STATES.HEALTH_REVIEW_EDIT
      );
    }

    if (nextAction === "PERSONAL_INFO") {
      return StateManager.updateAndReturn(
        this.userId,
        STATES.HEALTH_PERSONAL_EDIT,
        `What personal information would you like to edit?\n\
        n1️⃣ Surname\n
        2️⃣ Middle Name\n
        3️⃣ First Name\n
        4️⃣ Email\n
        5️⃣ Phone\n
        6️⃣ Cancel`
      );
    }

    if (nextAction === STATES.HEALTH_PROVIDER_SELECT) {
      const ProviderSelectionStep = (await import("./ProviderSelectionStep.js"))
        .ProviderSelectionStep;
      return new ProviderSelectionStep(this.userId).loadAndShowProviders();
    }

    const messages = {
      [STATES.HEALTH_REG_MARITAL]:
        "What is your *Marital Status*?\n\n1️⃣ Single\n2️⃣ Married\n3️⃣ Widowed\n4️⃣ Separated\n5️⃣ Divorced",
      [STATES.HEALTH_REG_STATE]: "What *State* do you live in?",
      [STATES.HEALTH_REG_ADDRESS]: "What is your *Home Address*?",
    };

    return StateManager.updateAndReturn(
      this.userId,
      nextAction,
      messages[nextAction],
      { editMode: true }
    );
  }

  async handlePersonalEdit(input) {
    const personalEditOptions = {
      1: STATES.HEALTH_REG_SURNAME,
      2: STATES.HEALTH_REG_MIDDLENAME,
      3: STATES.HEALTH_REG_FIRSTNAME,
      4: STATES.HEALTH_REG_EMAIL,
      5: STATES.HEALTH_REG_PHONE,
    };

    const nextState = personalEditOptions[input];

    if (!nextState) {
      if (input === "6" || input.includes("cancel")) {
        return StateManager.updateAndReturn(
          this.userId,
          STATES.HEALTH_REVIEW,
          this.showReviewSummary().message
        );
      }
      return this.createResponse(
        `Please select a valid option (1-6).`,
        STATES.HEALTH_PERSONAL_EDIT
      );
    }

    const messages = {
      [STATES.HEALTH_REG_SURNAME]: "What is your *Surname* (Last Name)?",
      [STATES.HEALTH_REG_MIDDLENAME]:
        'What is your *Middle Name*?\n\n_Type "SKIP" if you don\'t have a middle name._',
      [STATES.HEALTH_REG_FIRSTNAME]: "What is your *First Name*?",
      [STATES.HEALTH_REG_EMAIL]:
        "What is your *Email Address*?\n\n_Please enter a valid email address_\n_Example: john@example.com_",
      [STATES.HEALTH_REG_PHONE]:
        "What is your *Phone Number*?\n\n_Please enter your 11-digit Nigerian phone number_\n_Example: 08012345678_",
    };

    return StateManager.updateAndReturn(
      this.userId,
      nextState,
      messages[nextState],
      { editMode: true }
    );
  }
}
