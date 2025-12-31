import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { MessageTemplates } from "../utils/messageUtils.js";
import { InsuranceAPIService } from "../services/apiService.js";

export class PolicyHandler {
  static async handleLookup(userId, input, text) {
    // Simulate API lookup
    const result = await InsuranceAPIService.lookupPolicy(text);

    if (result.found) {
      const policy = result.policy;
      SessionManager.updateSession(userId, STATES.POLICY_OPTIONS, { policy });

      return {
        message: `✅ *Policy Found*

Policy Number: ${policy.number}
Type: ${policy.type}
Status: ${policy.status}
Renewal Date: ${policy.renewal}
Premium: ₦${policy.premium}/month

What would you like to do?

1️⃣ View full policy details
2️⃣ Download policy document
3️⃣ Pay renewal
4️⃣ Update information
5️⃣ Back to menu`,
        state: STATES.POLICY_OPTIONS,
      };
    }

    return {
      message: "❌ Policy not found. Please check your policy number or phone number and try again.\n\nType MENU to return to the main menu.",
      state: STATES.MAIN_MENU,
    };
  }

  static handleOptions(userId, input, text) {
    if (input === "1" || input.includes("view") || input.includes("details")) {
      return {
        message: `📋 *Full Policy Details*

Coverage Details:
• Hospital bills up to ₦1M/year
• Outpatient services
• Prescription drugs
• Emergency care
• Dental (optional)

Beneficiaries: [List here]
Start Date: 2024-01-01
Expiry Date: 2025-12-31

Type MENU to return.`,
        state: STATES.POLICY_OPTIONS,
      };
    }

    if (input === "2" || input.includes("download")) {
      return {
        message: `📄 Your policy document is being generated...

Download link: https://policies.skydd.com/SKY12345678.pdf

Type MENU to return to main menu.`,
        state: STATES.MAIN_MENU,
      };
    }

    if (input === "3" || input.includes("renewal") || input.includes("pay")) {
      SessionManager.updateSession(userId, STATES.PAYMENT_METHOD);
      return {
        message: `💳 *Payment Options*

Your premium: ₦45,000/month

How would you like to pay?

1️⃣ Pay Online (Card/Bank)
2️⃣ Bank Transfer
3️⃣ USSD

_Select your preferred payment method._`,
        state: STATES.PAYMENT_METHOD,
      };
    }

    if (input === "4" || input.includes("update")) {
      return {
        message: `📝 *Update Information*

What would you like to update?

1️⃣ Contact details
2️⃣ Address
3️⃣ Beneficiaries
4️⃣ Back

Please select an option.`,
        state: STATES.POLICY_OPTIONS,
      };
    }

    if (input === "5" || input.includes("menu") || input.includes("back")) {
      SessionManager.updateSession(userId, STATES.MAIN_MENU);
      return {
        message: MessageTemplates.getMainMenu(),
        state: STATES.MAIN_MENU,
      };
    }

    return {
      message: "Please select an option (1-5).",
      state: STATES.POLICY_OPTIONS,
    };
  }
}
