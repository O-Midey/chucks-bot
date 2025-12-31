import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { InsuranceAPIService } from "../services/apiService.js";

export class ClaimsHandler {
  static handleMenu(userId, input, text) {
    if (input === "1" || input.includes("make") || input.includes("file")) {
      SessionManager.updateSession(userId, STATES.CLAIM_TYPE);
      return {
        message: `📋 *Make a Claim*

What type of insurance is this claim for?

1️⃣ Health Insurance
2️⃣ Auto Insurance
3️⃣ Device Insurance
4️⃣ Life Insurance
5️⃣ Property Insurance

Please select the type.`,
        state: STATES.CLAIM_TYPE,
      };
    }

    if (input === "2" || input.includes("track") || input.includes("status")) {
      SessionManager.updateSession(userId, STATES.CLAIM_TRACKING);
      return {
        message: `🔍 *Track Your Claim*

Please provide your Claim ID.

_Example: CLM12345_`,
        state: STATES.CLAIM_TRACKING,
      };
    }

    if (input === "3" || input.includes("agent") || input.includes("speak")) {
      SessionManager.updateSession(userId, STATES.AGENT_CONNECT);
      return {
        message: `👤 *Connect with an Agent*

I'm connecting you with one of our support agents.

Please briefly describe your issue:`,
        state: STATES.AGENT_CONNECT,
      };
    }

    return {
      message: "Please select 1, 2, or 3.",
      state: STATES.CLAIMS_MENU,
    };
  }

  static handleType(userId, input, text) {
    const claimTypes = ["Health", "Auto", "Device", "Life", "Property"];
    const claimIndex = parseInt(input) - 1;

    if (claimIndex >= 0 && claimIndex < claimTypes.length) {
      const claimType = claimTypes[claimIndex];
      SessionManager.updateSession(userId, STATES.CLAIM_DESCRIPTION, {
        claimType,
      });
      return {
        message: `📝 *${claimType} Insurance Claim*

Please describe what happened:

_Be as detailed as possible._`,
        state: STATES.CLAIM_DESCRIPTION,
      };
    }

    return {
      message: "Please select a number between 1-5.",
      state: STATES.CLAIM_TYPE,
    };
  }

  static handleDescription(userId, input, text) {
    SessionManager.updateSession(userId, STATES.CLAIM_LOCATION, {
      claimDescription: text,
    });
    return {
      message: "📍 Where did this happen?\n\n_Please provide the location._",
      state: STATES.CLAIM_LOCATION,
    };
  }

  static handleLocation(userId, input, text) {
    SessionManager.updateSession(userId, STATES.CLAIM_DOCUMENTS, {
      claimLocation: text,
    });
    return {
      message: `📎 *Upload Supporting Documents*

Please upload:
• Photos of damage/incident
• Receipts or invoices
• Police report (if applicable)
• Any other relevant documents

After uploading, reply "DONE"

Or reply "SKIP" if you don't have documents now.`,
      state: STATES.CLAIM_DOCUMENTS,
    };
  }

  static async handleDocuments(userId, input, text) {
    if (input.includes("done") || input.includes("skip")) {
      const session = await SessionManager.getSession(userId);
      const claimResult = await InsuranceAPIService.submitClaim(session.data);

      SessionManager.clearSession(userId);

      return {
        message: `✅ *Claim Submitted Successfully*

Your Claim ID: *${claimResult.claimId}*

We've received your claim and will review it within 24-48 hours.

You'll receive updates via:
• WhatsApp
• Email
• SMS

Track your claim anytime by typing "TRACK" and your claim ID.

Type MENU for more options.`,
        state: STATES.MAIN_MENU,
      };
    }

    return {
      message: "Please reply \"DONE\" when finished uploading, or \"SKIP\" to continue without documents.",
      state: STATES.CLAIM_DOCUMENTS,
    };
  }

  static handleTracking(userId, input, text) {
    const mockClaim = {
      id: text.toUpperCase(),
      status: "Under Review",
      submitted: "2025-11-10",
      type: "Health Insurance",
      amount: "₦50,000",
    };

    return {
      message: `🔍 *Claim Status*

Claim ID: ${mockClaim.id}
Type: ${mockClaim.type}
Status: ${mockClaim.status}
Submitted: ${mockClaim.submitted}
Amount: ${mockClaim.amount}

Expected Resolution: 2-3 business days

We'll notify you once your claim is processed.

Type MENU to return to main menu.`,
      state: STATES.MAIN_MENU,
    };
  }
}
