import { BaseStep } from "./BaseStep.js";
import { STATES } from "../../../config/constants.js";
import { HealthInsuranceFormatter } from "../formatters/HealthInsuranceFormatter.js";
import { HEALTH_PLANS } from "../config/healthPlans.js";

export class PlanSelectionStep extends BaseStep {
  async showPlans() {
    const message = HealthInsuranceFormatter.formatPlansList(HEALTH_PLANS);
    this.updateSession(STATES.HEALTH_PLANS_LIST, {
      availablePlans: HEALTH_PLANS,
    });
    return this.createResponse(message, STATES.HEALTH_PLANS_LIST);
  }

  async handlePlanSelection(input, text) {
    const plans = this.getSessionData().availablePlans || HEALTH_PLANS;

    // Check if user wants details
    if (input.includes("d") || input.includes("detail")) {
      return this.showPlanDetails(input, plans);
    }

    // Regular plan selection
    const planNumber = parseInt(input);
    if (planNumber >= 1 && planNumber <= plans.length) {
      return this.selectPlan(plans[planNumber - 1]);
    }

    return this.createResponse(
      `Please select a valid plan number (1-${plans.length}), or type a number + 'D' to view details (e.g., 1D).`,
      STATES.HEALTH_PLANS_LIST
    );
  }

  showPlanDetails(input, plans) {
    const planNumber = parseInt(input.replace(/d|detail/gi, "").trim());

    if (planNumber >= 1 && planNumber <= plans.length) {
      const selectedPlan = plans[planNumber - 1];
      const message = HealthInsuranceFormatter.formatPlanDetails(selectedPlan);
      return this.createResponse(message, STATES.HEALTH_PLAN_DETAILS);
    }

    return this.createResponse(
      `Invalid plan number. Please try again.`,
      STATES.HEALTH_PLANS_LIST
    );
  }

  selectPlan(plan) {
    this.updateSession(STATES.HEALTH_REG_SURNAME, {
      selectedPlan: plan,
      planId: plan.id || plan.plan_id,
      planName: plan.title,
      planPremium: plan.cost,
    });

    let message = `✅ You've selected: *${plan.title}*\n\n`;
    message += `📋 *Let's get your details for enrollment.*\n\n`;
    message += `*Step 1: Personal Information*\n\n`;
    message += `What is your *Surname* (Last Name)?`;

    return this.createResponse(message, STATES.HEALTH_REG_SURNAME);
  }
}
