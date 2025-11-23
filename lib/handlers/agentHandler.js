import { STATES } from "../config/constants.js";

export class AgentHandler {
  static handle(userId, input, text) {
    // Forward to human agent system
    return {
      message: `✅ Your message has been forwarded to our support team.

"${text}"

An agent will contact you within:
• 5-10 minutes (during business hours)
• Next business day (outside hours)

Business Hours: Mon-Fri, 9 AM - 5 PM

Or call us: +234 XXX XXX XXXX

Type MENU to return.`,
      state: STATES.MAIN_MENU,
    };
  }
}
