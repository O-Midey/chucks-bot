import { Validators } from "../../../utils/validationUtils.js";

export class HealthInsuranceFormatter {
  // Helper function to format numbers with proper emojis
  static formatNumberEmoji(number) {
    const emojiMap = {
      1: "1️⃣",
      2: "2️⃣",
      3: "3️⃣",
      4: "4️⃣",
      5: "5️⃣",
      6: "6️⃣",
      7: "7️⃣",
      8: "8️⃣",
      9: "9️⃣",
      10: "🔟",
      11: "1️⃣1️⃣",
      12: "1️⃣2️⃣",
      13: "1️⃣3️⃣",
      14: "1️⃣4️⃣",
      15: "1️⃣5️⃣",
      16: "1️⃣6️⃣",
      17: "1️⃣7️⃣",
      18: "1️⃣8️⃣",
      19: "1️⃣9️⃣",
      20: "2️⃣0️⃣",
      21: "2️⃣1️⃣",
      22: "2️⃣2️⃣",
      23: "2️⃣3️⃣",
      24: "2️⃣4️⃣",
      25: "2️⃣5️⃣",
      26: "2️⃣6️⃣",
      27: "2️⃣7️⃣",
      28: "2️⃣8️⃣",
      29: "2️⃣9️⃣",
      30: "3️⃣0️⃣",
    };
    return emojiMap[number] || `${number}.`;
  }

  static formatPlansList(plans) {
    let message = "🏥 *Health Insurance Plans*\n\n";
    message += "Choose from our available plans:\n\n";

    const categories = {
      basic: { title: "*Basic Plans (Monthly)*", plans: [] },
      diaspora: { title: "*Diaspora Plans (Yearly - USD)*", plans: [] },
      hdptc: { title: " *HDPTC Plans (Yearly)*", plans: [] },
      gems: { title: " *Chuks Gems (Yearly)*", plans: [] },
      "diaspora-hdptc": {
        title: " *Diaspora HDPTC (Yearly - USD)*",
        plans: [],
      },
    };

    plans.forEach((plan) => {
      if (categories[plan.category]) {
        categories[plan.category].plans.push(plan);
      }
    });

    Object.values(categories).forEach((category) => {
      if (category.plans.length > 0) {
        message += `${category.title}\n`;
        category.plans.forEach((plan) => {
          const currency = plan.currency === "USD" ? "$" : "₦";
          message += `*${this.formatNumberEmoji(plan.id)} ${plan.title}*\n\n`;
          message += `Premium: ${currency}${Validators.formatAmount(
            plan.cost
          )}/${plan.period}\n\n`;
        });
      }
    });

    message += `\n_Reply with a number (1-${plans.length}) to select a plan._`;
    message += "\n_Or reply with the number + 'D' (e.g., 1D) to view detailed coverage._";

    return message;
  }

  static formatPlanDetails(plan) {
    const currency = plan.currency === "USD" ? "$" : "₦";
    let message = `📋 *${plan.title}*\n\n`;
    message += `*Premium:* ${currency}${Validators.formatAmount(plan.cost)}/${
      plan.period
    }\n`;

    if (plan.annualLimit) {
      message += `*Annual Medical Limit:* ${plan.annualLimit}\n\n`;
    }

    if (plan.detailedCoverage && plan.detailedCoverage.length > 0) {
      message += "*Coverage Details:*\n\n";
      plan.detailedCoverage.forEach((item) => {
        message += `${item}\n\n`;
      });
    } else {
      message += `*Coverage:* ${plan.description}\n\n`;
    }

    message += `Type ${plan.id} to select this plan, or type BACK to see all plans.`;
    return message;
  }

  static formatReviewSummary(data) {
    let message = "📋 *Please Review Your Details*\n\n";
    message += `*Provider:*\n${data.providerName}\n\n`;
    message += "*Personal Information:*\n";
    message += `Full Name: ${data.surname} ${data.middlename} ${data.firstname}\n`;
    message += `Email: ${data.email}\n`;
    message += `Phone: ${data.phone}\n\n`;
    message += "*Demographics:*\n";
    message += `Marital Status: ${data.marital_status}\n\n`;
    message += "*Location:*\n";
    message += `State: ${data.state}\n`;
    message += `LGA: ${data.lga}\n`;
    message += `Home Address: ${data.address}\n\n`;
    message += "*Please choose:*\n\n";
    message += "1️⃣ Confirm & Proceed to Registration\n";
    message += "2️⃣ Edit Information\n";
    message += "3️⃣ Cancel Registration";
    return message;
  }

  static formatProviderList(providers, showSearch = false) {
    let message = "🏥 *Healthcare Providers*\n\n";

    providers.forEach((provider, index) => {
      const providerName = provider.agency_name.trim();
      const location = provider.localgovt?.local_name
        ? ` (${provider.localgovt.local_name})`
        : "";
      message += `${this.formatNumberEmoji(
        index + 1
      )} ${providerName}${location}\n`;
    });

    message += `\n_Reply with a number (1-${providers.length}) to select a provider._`;
    message += "\n_Type \"CHANGE LGA\" to select a different area._";
    message += "\n_Or search by typing a provider name (e.g., \"General Hospital\")._";
    message += "\n\n📝 *Please select a healthcare provider, not your address.*";

    return message;
  }

  static formatPaymentMessage(premium, currency, checkoutUrl, serviceCharge) {
    let message = "💳 *Complete Your Payment*\n\n";
    const currencySymbol = currency === "USD" ? "$" : "₦";
    message += `Premium: ${currencySymbol}${Validators.formatAmount(
      premium
    )}\n`;
    message += `Service Charge (3%): ${currencySymbol}${Validators.formatAmount(
      serviceCharge
    )}\n`;
    message += `*Total Amount: ${currencySymbol}${Validators.formatAmount(
      premium + serviceCharge
    )}*\n\n`;
    message += "_A 3% service charge will be automatically applied at the point of checkout._\n\n";
    message += `Click the link below to pay:\n${checkoutUrl}\n\n`;
    message += "After payment, reply \"DONE\" to activate your policy.\n\n";
    message += "_Type \"CANCEL\" to cancel payment and return to main menu._";
    return message;
  }
}
