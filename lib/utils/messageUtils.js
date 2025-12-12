export const MessageTemplates = {
  getWelcome() {
    return `👋 Hello! I'm *CHUKS* — your personal insurance assistant.

I can help you get affordable insurance, manage your policies, make claims, or learn about our products. How can I help you today?

${this.getMainMenu()}`;
  },

  getMainMenu() {
    return `*MAIN MENU*

1️⃣ Get a Quote
2️⃣ Learn About Our Products
3️⃣ Policy Management
4️⃣ Claims & Support
5️⃣ FAQs

_Reply with a number or type what you need._`;
  },

  getQuoteCategories() {
    return `🎯 *Get a Quote*

What type of insurance would you like a quote for?

1️⃣ Health Insurance
2️⃣ Auto / Car Insurance
3️⃣ Device Insurance
4️⃣ Life Insurance
5️⃣ Property Insurance
6️⃣ Salary Insurance
7️⃣ Credit Insurance
8️⃣ Travel Insurance (Coming Soon)

_Reply with a number or type the insurance name._`;
  },

  getLearnProducts() {
    return `📚 *Learn About Our Products*

1️⃣ Health Insurance
2️⃣ Auto Insurance
3️⃣ Life Insurance
4️⃣ Device Insurance
5️⃣ Property Insurance
6️⃣ Salary Insurance
7️⃣ Travel Insurance

_Select a product to learn more._`;
  },

  getClaimsMenu() {
    return `🛟 *Claims & Support*

1️⃣ Make a Claim
2️⃣ Track Claim Status
3️⃣ Speak to an Agent

_How can I help you?_`;
  },

  getFAQMenu() {
    return `❓ *Frequently Asked Questions*

1️⃣ Health Insurance FAQs
2️⃣ Auto Insurance FAQs
3️⃣ Life Insurance FAQs
4️⃣ Device Insurance FAQs
5️⃣ Payment & Billing FAQs
6️⃣ Claims FAQs
7️⃣ General Insurance Questions

_Which category interests you?_`;
  },
};

export function isGreeting(text) {
  const greetings = ["hi", "hello", "hey", "start", "menu", "restart", "help"];
  const lowerText = text.toLowerCase().trim();
  return greetings.some(
    (g) => lowerText === g || lowerText.startsWith(g + " ")
  );
}
