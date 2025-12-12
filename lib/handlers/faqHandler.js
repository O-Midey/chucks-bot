import { STATES } from "../config/constants.js";

export class FAQHandler {
  static handle(userId, input, text) {
    const faqData = {
      1: {
        title: "Health Insurance FAQs",
        questions: [
          {
            q: "What does health insurance cover?",
            a: "Hospital bills, outpatient care, medications, diagnostic tests, and more.",
          },
          {
            q: "Can I add family members?",
            a: "Yes, you can add spouse and children to your plan.",
          },
          {
            q: "Are pre-existing conditions covered?",
            a: "Some conditions may have waiting periods. Contact us for details.",
          },
          {
            q: "How do I make a claim?",
            a: "Visit any partner hospital or submit receipts through our claims portal.",
          },
        ],
      },
      2: {
        title: "Auto Insurance FAQs",
        questions: [
          {
            q: "What's the difference between comprehensive and third-party?",
            a: "Comprehensive covers your car + others. Third-party only covers others.",
          },
          {
            q: "What's not covered?",
            a: "Wear and tear, driving under influence, unlicensed drivers.",
          },
          {
            q: "How long does claims take?",
            a: "5-10 business days after inspection.",
          },
          {
            q: "Do I need to renew?",
            a: "Yes, annually before expiry date.",
          },
        ],
      },
      3: {
        title: "Life Insurance FAQs",
        questions: [
          {
            q: "Who receives the payout?",
            a: "Your named beneficiaries.",
          },
          {
            q: "When does coverage start?",
            a: "Immediately after payment and approval.",
          },
          {
            q: "Can I change beneficiaries?",
            a: "Yes, anytime through our portal.",
          },
          {
            q: "What if I miss a payment?",
            a: "You have a 30-day grace period.",
          },
        ],
      },
      4: {
        title: "Device Insurance FAQs",
        questions: [
          {
            q: "Are used devices covered?",
            a: "Yes, if less than 2 years old.",
          },
          {
            q: "How many claims can I make?",
            a: "Up to 2 per year.",
          },
          {
            q: "What about stolen devices?",
            a: "Covered with police report.",
          },
          {
            q: "Repair or replacement?",
            a: "Repair first, replacement if unrepairable.",
          },
        ],
      },
      5: {
        title: "Payment & Billing FAQs",
        questions: [
          {
            q: "Payment methods?",
            a: "Card, transfer, USSD, or installments.",
          },
          {
            q: "Can I pay monthly?",
            a: "Yes, for most products.",
          },
          {
            q: "Refund policy?",
            a: "Available within 14 days if no claims made.",
          },
          {
            q: "Discounts available?",
            a: "Yes, for annual payments and multiple policies.",
          },
        ],
      },
      6: {
        title: "Claims FAQs",
        questions: [
          {
            q: "How long do claims take?",
            a: "3-10 business days depending on type.",
          },
          {
            q: "What documents needed?",
            a: "Policy number, incident description, supporting docs.",
          },
          {
            q: "Can I track my claim?",
            a: "Yes, using your claim ID.",
          },
          {
            q: "What if claim is denied?",
            a: "You can appeal with additional evidence.",
          },
        ],
      },
      7: {
        title: "General Insurance Questions",
        questions: [
          {
            q: "How do I cancel my policy?",
            a: "Contact us 30 days before renewal.",
          },
          {
            q: "Can I upgrade my plan?",
            a: "Yes, at any time with price adjustment.",
          },
          {
            q: "What is a premium?",
            a: "The amount you pay for insurance coverage.",
          },
          {
            q: "Do you have agents?",
            a: "Yes, contact us to speak with an agent.",
          },
        ],
      },
    };

    const categoryNumber = parseInt(input);
    const faqCategory = faqData[categoryNumber];

    if (!faqCategory) {
      return {
        message: `Please select a number between 1-7.`,
        state: STATES.FAQ_CATEGORY,
      };
    }

    let message = `❓ *${faqCategory.title}*\n\n`;
    faqCategory.questions.forEach((item, index) => {
      message += `${index + 1}. *Q:* ${item.q}\n`;
      message += `   *A:* ${item.a}\n\n`;
    });
    message += `\nType MENU to return to main menu or ask another question.`;

    return {
      message,
      state: STATES.FAQ_CATEGORY,
    };
  }
}
