import { STATES } from "../../../config/constants.js";
import { SessionManager } from "../../../session/sessionManager.js";

export class NavigationManager {
  static STATE_FLOW = {
    [STATES.HEALTH_PLAN_DETAILS]: STATES.HEALTH_PLANS_LIST,
    [STATES.HEALTH_REG_MIDDLENAME]: STATES.HEALTH_REG_SURNAME,
    [STATES.HEALTH_REG_FIRSTNAME]: STATES.HEALTH_REG_MIDDLENAME,
    [STATES.HEALTH_REG_EMAIL]: STATES.HEALTH_REG_FIRSTNAME,
    [STATES.HEALTH_REG_PHONE]: STATES.HEALTH_REG_EMAIL,
    [STATES.HEALTH_REG_MARITAL]: STATES.HEALTH_REG_PHONE,
    [STATES.HEALTH_REG_STATE]: STATES.HEALTH_REG_MARITAL,
    [STATES.HEALTH_REG_LGA]: STATES.HEALTH_REG_STATE,
    [STATES.HEALTH_REG_ADDRESS]: STATES.HEALTH_REG_LGA,
    [STATES.HEALTH_PROVIDER_SELECT]: STATES.HEALTH_REG_ADDRESS,
    [STATES.HEALTH_REVIEW]: STATES.HEALTH_PROVIDER_SELECT,
  };

  static STATE_PROMPTS = {
    [STATES.HEALTH_REG_SURNAME]: {
      message: "What is your *Surname* (Last Name)?",
    },
    [STATES.HEALTH_REG_MIDDLENAME]: {
      message:
        'What is your *Middle Name*?\n\n_Type "SKIP" if you don\'t have a middle name._',
    },
    [STATES.HEALTH_REG_FIRSTNAME]: {
      message: "What is your *First Name*?",
    },
    [STATES.HEALTH_REG_EMAIL]: {
      message:
        "What is your *Email Address*?\n\n_Please enter a valid email address_\n_Example: john@example.com_",
    },
    [STATES.HEALTH_REG_PHONE]: {
      message:
        "What is your *Phone Number*?\n\n_Please enter your 11-digit Nigerian phone number_\n_Example: 08012345678_",
    },
    [STATES.HEALTH_REG_MARITAL]: {
      message:
        "What is your *Marital Status*?\n\n1️⃣ Single\n2️⃣ Married\n3️⃣ Widowed\n4️⃣ Separated\n5️⃣ Divorced",
    },
  };

  static async goBack(userId, currentState) {
    const previousState = this.STATE_FLOW[currentState];

    if (!previousState) {
      return {
        message: `Cannot go back from this step. Type MENU to return to main menu.`,
        state: currentState,
      };
    }

    // Special case for going back to plans list
    if (previousState === STATES.HEALTH_PLANS_LIST) {
      const PlanSelectionStep = (await import("../steps/PlanSelectionStep.js"))
        .PlanSelectionStep;
      return new PlanSelectionStep(userId).showPlans();
    }

    const prompt = this.STATE_PROMPTS[previousState] || {
      message: "Please continue with your registration.",
    };

    SessionManager.updateSession(userId, previousState);
    return {
      message: prompt.message,
      state: previousState,
    };
  }

  static async handleGlobalCommands(userId, input, currentState) {
    if (input === "back" || input === "previous") {
      return await this.goBack(userId, currentState);
    }
    return null;
  }
}
