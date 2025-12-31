import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { MessageTemplates } from "../utils/messageUtils.js";

export class LearnHandler {
  static handleProducts(userId, input, text) {
    const productMap = {
      1: "health",
      2: "auto",
      3: "life",
      4: "device",
      5: "property",
      6: "salary",
      7: "travel",
    };

    const productKey = parseInt(input);
    const productType = productMap[productKey];

    if (!productType) {
      return {
        message: "Please select a number between 1-7.",
        state: STATES.LEARN_PRODUCTS,
      };
    }

    SessionManager.updateSession(userId, STATES.PRODUCT_DETAIL, {
      selectedProduct: productType,
    });
    return this.getProductDetails(productType);
  }

  static getProductDetails(productType) {
    const products = {
      health: {
        title: "🏥 *Health Insurance*",
        overview: "Comprehensive medical coverage for you and your family.",
        coverage: [
          "Hospital bills & surgeries",
          "Outpatient consultations",
          "Prescription medications",
          "Diagnostic tests & scans",
          "Dental & optical (optional)",
          "Maternity care",
          "Emergency ambulance",
        ],
        whoShouldBuy: [
          "Everyone! Medical emergencies can happen anytime",
          "Families with children",
          "People with chronic conditions",
          "Senior citizens",
        ],
        priceRange: "From ₦25,000/year (individual) to ₦120,000/year (family)",
      },
      auto: {
        title: "🚗 *Auto Insurance*",
        overview:
          "Protection for your vehicle against accidents, theft, and damage.",
        coverage: [
          "Accident repairs",
          "Fire & theft",
          "Third-party liability",
          "Windscreen damage",
          "Flood damage",
          "Towing & roadside assistance",
          "Access to approved workshops",
        ],
        whoShouldBuy: [
          "All vehicle owners (required by law)",
          "Commercial vehicle operators",
          "Fleet owners",
        ],
        priceRange:
          "From ₦15,000/year (third-party) to 5% of vehicle value (comprehensive)",
      },
      life: {
        title: "❤️ *Life Insurance*",
        overview: "Financial security for your loved ones when you're gone.",
        coverage: [
          "Death benefit payout",
          "Terminal illness cover",
          "Permanent disability",
          "Funeral expenses",
          "Estate planning support",
        ],
        whoShouldBuy: [
          "Breadwinners with dependents",
          "Parents with young children",
          "Business owners",
          "Anyone wanting to leave a legacy",
        ],
        priceRange:
          "From ₦10,000/month (₦1M coverage) to ₦100,000/month (₦20M+ coverage)",
      },
      device: {
        title: "📱 *Device Insurance*",
        overview:
          "Protect your phones, laptops, and tablets from damage and theft.",
        coverage: [
          "Cracked/broken screens",
          "Liquid damage",
          "Theft & robbery",
          "Hardware malfunction",
          "Worldwide coverage",
        ],
        whoShouldBuy: [
          "Smartphone owners (especially flagship devices)",
          "Remote workers with laptops",
          "Frequent travelers",
          "Students with devices",
        ],
        priceRange:
          "From ₦3,000/year (basic phones) to ₦15,000/year (premium devices)",
      },
      property: {
        title: "🏠 *Property Insurance*",
        overview:
          "Coverage for your home, shop, or office against various risks.",
        coverage: [
          "Fire damage",
          "Theft & burglary",
          "Flood & natural disasters",
          "Vandalism",
          "Building & contents",
          "Business interruption (for commercial)",
        ],
        whoShouldBuy: [
          "Homeowners",
          "Landlords",
          "Shop/business owners",
          "Office tenants",
        ],
        priceRange:
          "From ₦30,000/year (basic fire) to 0.5% of property value (all-risk)",
      },
      salary: {
        title: "💰 *Salary Insurance*",
        overview:
          "Income protection when you can't work due to illness, job loss, or disability.",
        coverage: [
          "Monthly salary replacement (up to 6-12 months)",
          "Coverage for illness/injury",
          "Job loss protection",
          "Disability benefits",
        ],
        whoShouldBuy: [
          "Salaried employees",
          "Contract workers",
          "Self-employed professionals",
          "Single-income households",
        ],
        priceRange: "🚧 Coming Soon",
        status: "development",
      },
      travel: {
        title: "✈️ *Travel Insurance*",
        overview: "Protection when traveling domestically or internationally.",
        coverage: [
          "Medical emergencies abroad",
          "Trip cancellation/interruption",
          "Lost/delayed luggage",
          "Flight delays",
          "Emergency evacuation",
          "Personal liability",
        ],
        whoShouldBuy: [
          "International travelers",
          "Business travelers",
          "Adventure seekers",
          "Family vacationers",
        ],
        priceRange: "🚧 Coming Soon",
        status: "development",
      },
    };

    const product = products[productType];

    let message = `${product.title}\n\n`;
    message += `*Overview:*\n${product.overview}\n\n`;
    message += "*What it covers:*\n";
    product.coverage.forEach((item) => {
      message += `• ${item}\n`;
    });
    message += "\n*Who should buy it:*\n";
    product.whoShouldBuy.forEach((item) => {
      message += `• ${item}\n`;
    });
    message += `\n*Price Range:*\n${product.priceRange}\n\n`;

    if (product.status === "development") {
      message += "*Status:* 🚧 Coming Soon\n\n";
      message += "Would you like to:\n";
      message += "1️⃣ Join waitlist\n";
      message += "2️⃣ Back to products\n";
      message += "3️⃣ Main menu";
    } else {
      message += "Would you like to:\n";
      message += "1️⃣ Get a quote\n";
      message += "2️⃣ Back to products\n";
      message += "3️⃣ Main menu";
    }

    return { message, state: STATES.PRODUCT_DETAIL };
  }

  static async handleProductDetail(userId, input, text) {
    const session = await SessionManager.getSession(userId);
    const selectedProduct = session.data.selectedProduct;

    if (input === "1") {
      // Check if it's a development product
      if (selectedProduct === "salary" || selectedProduct === "travel") {
        return {
          message: `✅ Great! You've been added to the ${selectedProduct} insurance waitlist.\n\nType MENU to return to the main menu.`,
          state: STATES.MAIN_MENU,
        };
      }

      // Redirect to quote flow
      SessionManager.updateSession(userId, STATES.QUOTE_CATEGORY);
      return {
        message: MessageTemplates.getQuoteCategories(),
        state: STATES.QUOTE_CATEGORY,
      };
    }

    if (input === "2" || input.includes("back") || input.includes("products")) {
      SessionManager.updateSession(userId, STATES.LEARN_PRODUCTS);
      return {
        message: MessageTemplates.getLearnProducts(),
        state: STATES.LEARN_PRODUCTS,
      };
    }

    if (input === "3" || input.includes("menu")) {
      SessionManager.updateSession(userId, STATES.MAIN_MENU);
      return {
        message: MessageTemplates.getMainMenu(),
        state: STATES.MAIN_MENU,
      };
    }

    return {
      message: "Please select 1, 2, or 3.",
      state: STATES.PRODUCT_DETAIL,
    };
  }
}
