import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { Validators } from "../utils/validationUtils.js";
import { MessageTemplates } from "../utils/messageUtils.js";

export class SalaryInsuranceHandler {
  static handleAmount(userId, input, text) {
    if (!Validators.isValidAmount(text, 50000)) {
      return {
        message: `Please enter a valid monthly salary (e.g., 150000)`,
        state: STATES.SALARY_AMOUNT,
      };
    }

    const salary = Validators.parseAmount(text);
    SessionManager.updateSession(userId, STATES.SALARY_EMPLOYMENT, { salary });
    return {
      message: `What is your employment type?\n\n1️⃣ Permanent/Full-time\n2️⃣ Contract\n3️⃣ Self-employed`,
      state: STATES.SALARY_EMPLOYMENT,
    };
  }

  static handleEmployment(userId, input, text) {
    let employmentType = "";

    if (
      input === "1" ||
      input.includes("permanent") ||
      input.includes("full")
    ) {
      employmentType = "Permanent";
    } else if (input === "2" || input.includes("contract")) {
      employmentType = "Contract";
    } else if (input === "3" || input.includes("self")) {
      employmentType = "Self-employed";
    } else {
      return {
        message: `Please select 1, 2, or 3.`,
        state: STATES.SALARY_EMPLOYMENT,
      };
    }

    SessionManager.updateSession(userId, STATES.SALARY_COVERAGE, {
      employmentType,
    });
    return {
      message: `What coverage do you need?\n\n1️⃣ Illness only\n2️⃣ Job loss only\n3️⃣ Disability only\n4️⃣ Comprehensive (All of the above)`,
      state: STATES.SALARY_COVERAGE,
    };
  }

  static handleCoverage(userId, input, text) {
    let coverage = "";

    if (input === "1" || input.includes("illness")) {
      coverage = "Illness";
    } else if (input === "2" || input.includes("job")) {
      coverage = "Job loss";
    } else if (input === "3" || input.includes("disability")) {
      coverage = "Disability";
    } else if (
      input === "4" ||
      input.includes("comprehensive") ||
      input.includes("all")
    ) {
      coverage = "Comprehensive";
    } else {
      return {
        message: `Please select 1, 2, 3, or 4.`,
        state: STATES.SALARY_COVERAGE,
      };
    }

    SessionManager.updateSession(userId, STATES.SALARY_PLANS, {
      salaryCoverage: coverage,
    });

    return {
      message: `🚧 *Salary Insurance - Coming Soon*

This product is currently under development.

Would you like to:
1️⃣ Join the waitlist
2️⃣ Back to menu`,
      state: STATES.SALARY_PLANS,
    };
  }

  static handlePlans(userId, input, text) {
    if (input === "1" || input.includes("join") || input.includes("waitlist")) {
      return {
        message: `✅ Great! You've been added to the waitlist. We'll notify you as soon as Salary Insurance is available.\n\nType MENU to return to the main menu.`,
        state: STATES.MAIN_MENU,
      };
    }

    if (input === "2" || input.includes("menu") || input.includes("back")) {
      SessionManager.updateSession(userId, STATES.MAIN_MENU);
      return {
        message: MessageTemplates.getMainMenu(),
        state: STATES.MAIN_MENU,
      };
    }

    return {
      message: `Please select 1 or 2.`,
      state: STATES.SALARY_PLANS,
    };
  }
}
