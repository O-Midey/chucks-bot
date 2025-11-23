import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { Validators } from "../utils/validationUtils.js";
import { MessageTemplates } from "../utils/messageUtils.js";

export class HealthInsuranceHandler {
  static handleUserType(userId, input, text) {
    if (
      input === "1" ||
      input.includes("just me") ||
      input.includes("myself") ||
      input.includes("individual")
    ) {
      SessionManager.updateSession(userId, STATES.HEALTH_AGE, {
        userType: "individual",
      });
      return {
        message: `What is your age?\n\n_Please enter your age in years._`,
        state: STATES.HEALTH_AGE,
      };
    }

    if (
      input === "2" ||
      input.includes("family") ||
      input.includes("dependents")
    ) {
      SessionManager.updateSession(userId, STATES.HEALTH_AGE, {
        userType: "family",
      });
      return {
        message: `What is your age?\n\n_Please enter your age in years. We'll ask about family members next._`,
        state: STATES.HEALTH_AGE,
      };
    }

    return {
      message: `Please select either:\n1️⃣ Just me\n2️⃣ My family`,
      state: STATES.HEALTH_USER_TYPE,
    };
  }

  static handleAge(userId, input, text) {
    if (!Validators.isValidAge(text)) {
      return {
        message: `Please enter a valid age (e.g., 28)`,
        state: STATES.HEALTH_AGE,
      };
    }

    const age = parseInt(text);
    SessionManager.updateSession(userId, STATES.HEALTH_STATE, { age });
    return {
      message: `What state do you currently live in?\n\n_Example: Lagos, Abuja, Port Harcourt, etc._`,
      state: STATES.HEALTH_STATE,
    };
  }

  static handleState(userId, input, text) {
    SessionManager.updateSession(userId, STATES.HEALTH_CONDITIONS, {
      state: text,
    });
    return {
      message: `Do you have any pre-existing medical conditions?\n\n1️⃣ Yes\n2️⃣ No\n\n_This helps us provide accurate coverage options._`,
      state: STATES.HEALTH_CONDITIONS,
    };
  }

  static handleConditions(userId, input, text) {
    const hasConditions = input === "1" || input.includes("yes");
    SessionManager.updateSession(userId, STATES.HEALTH_PLANS, {
      hasConditions,
    });

    const session = SessionManager.getSession(userId);
    const { userType, age, state } = session.data;

    const plans = [
      {
        name: "Bronze",
        price: "25,000",
        coverage: "Basic coverage, outpatient, drugs",
      },
      {
        name: "Silver",
        price: "45,000",
        coverage: "Enhanced coverage, specialist care, dental",
      },
      {
        name: "Gold",
        price: "75,000",
        coverage: "Premium coverage, private rooms, international",
      },
    ];

    let message = `✅ *Available Health Insurance Plans*\n\n`;
    message += `Based on your profile:\n`;
    message += `• Type: ${userType === "family" ? "Family" : "Individual"}\n`;
    message += `• Age: ${age}\n`;
    message += `• State: ${state}\n\n`;

    plans.forEach((plan, index) => {
      message += `*${index + 1}️⃣ ${plan.name} Plan*\n`;
      message += `₦${plan.price}/month\n`;
      message += `${plan.coverage}\n\n`;
    });

    message += `_Reply with a number (1-3) to select a plan._`;

    return { message, state: STATES.HEALTH_PLANS };
  }

  static handlePlans(userId, input, text) {
    const planNumber = parseInt(input);

    if (planNumber >= 1 && planNumber <= 3) {
      const plans = ["Bronze", "Silver", "Gold"];
      const prices = ["25,000", "45,000", "75,000"];

      SessionManager.updateSession(userId, STATES.PAYMENT_METHOD, {
        selectedPlan: plans[planNumber - 1],
        premium: prices[planNumber - 1],
      });

      return {
        message: `Great choice! You've selected the *${
          plans[planNumber - 1]
        } Plan* at ₦${prices[planNumber - 1]}/month.

Would you like to activate this plan now?

1️⃣ Yes, proceed to payment
2️⃣ Save quote for later
3️⃣ Back to menu`,
        state: STATES.PAYMENT_METHOD,
      };
    }

    return {
      message: `Please select a plan by replying with 1, 2, or 3.`,
      state: STATES.HEALTH_PLANS,
    };
  }
}
