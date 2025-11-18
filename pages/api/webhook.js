import axios from "axios";

const BASE_URL = "https://waba-v2.360dialog.io";

// In-memory session storage (use Redis or database in production)
const sessions = new Map();

// Session timeout: 10 minutes
const SESSION_TIMEOUT = 10 * 60 * 1000;

// Conversation states
const STATES = {
  MAIN_MENU: "main_menu",
  QUOTE_CATEGORY: "quote_category",

  // Health Insurance States
  HEALTH_USER_TYPE: "health_user_type",
  HEALTH_AGE: "health_age",
  HEALTH_STATE: "health_state",
  HEALTH_CONDITIONS: "health_conditions",
  HEALTH_PLANS: "health_plans",

  // Auto Insurance States
  AUTO_TYPE: "auto_type",
  AUTO_BRAND: "auto_brand",
  AUTO_MODEL: "auto_model",
  AUTO_YEAR: "auto_year",
  AUTO_VALUE: "auto_value",
  AUTO_PLANS: "auto_plans",

  // Device Insurance States
  DEVICE_TYPE: "device_type",
  DEVICE_BRAND: "device_brand",
  DEVICE_MODEL: "device_model",
  DEVICE_CONDITION: "device_condition",
  DEVICE_VALUE: "device_value",
  DEVICE_PLANS: "device_plans",

  // Life Insurance States
  LIFE_AGE: "life_age",
  LIFE_DEPENDENTS: "life_dependents",
  LIFE_SUM: "life_sum",
  LIFE_CONDITIONS: "life_conditions",
  LIFE_PLANS: "life_plans",

  // Property Insurance States
  PROPERTY_TYPE: "property_type",
  PROPERTY_STATE: "property_state",
  PROPERTY_VALUE: "property_value",
  PROPERTY_COVERAGE: "property_coverage",
  PROPERTY_PLANS: "property_plans",

  // Salary Insurance States
  SALARY_AMOUNT: "salary_amount",
  SALARY_EMPLOYMENT: "salary_employment",
  SALARY_COVERAGE: "salary_coverage",
  SALARY_PLANS: "salary_plans",

  // Credit Insurance States
  CREDIT_AMOUNT: "credit_amount",
  CREDIT_DURATION: "credit_duration",
  CREDIT_TYPE: "credit_type",
  CREDIT_PLANS: "credit_plans",

  // Payment States
  PAYMENT_METHOD: "payment_method",
  PAYMENT_CONFIRMATION: "payment_confirmation",

  // Policy Management States
  POLICY_LOOKUP: "policy_lookup",
  POLICY_OPTIONS: "policy_options",

  // Claims States
  CLAIMS_MENU: "claims_menu",
  CLAIM_TYPE: "claim_type",
  CLAIM_DESCRIPTION: "claim_description",
  CLAIM_LOCATION: "claim_location",
  CLAIM_DOCUMENTS: "claim_documents",
  CLAIM_TRACKING: "claim_tracking",

  // Learn Products
  LEARN_PRODUCTS: "learn_products",
  PRODUCT_DETAIL: "product_detail",

  // FAQ
  FAQ_CATEGORY: "faq_category",

  // Agent Connection
  AGENT_CONNECT: "agent_connect",
};

// Get or create session
function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      state: STATES.MAIN_MENU,
      data: {},
      lastActivity: Date.now(),
    });
  }

  const session = sessions.get(userId);
  session.lastActivity = Date.now();
  return session;
}

// Update session state
function updateSession(userId, state, data = {}) {
  const session = getSession(userId);
  session.state = state;
  session.data = { ...session.data, ...data };
  sessions.set(userId, session);
}

// Clear session
function clearSession(userId) {
  sessions.delete(userId);
}

// Check for session timeout
function checkSessionTimeout(userId) {
  const session = sessions.get(userId);
  if (session && Date.now() - session.lastActivity > SESSION_TIMEOUT) {
    clearSession(userId);
    return true;
  }
  return false;
}

// Check if message is a greeting or restart command
function isGreeting(text) {
  const greetings = ["hi", "hello", "hey", "start", "menu", "restart", "help"];
  const lowerText = text.toLowerCase().trim();
  return greetings.some(
    (g) => lowerText === g || lowerText.startsWith(g + " ")
  );
}

// Main message handler
function handleMessage(userId, text) {
  // Check for session timeout
  if (checkSessionTimeout(userId)) {
    return {
      message:
        "⏰ Your session has timed out. Let's start fresh!\n\n" +
        getWelcomeMessage(),
      state: STATES.MAIN_MENU,
    };
  }

  // Check for greeting/restart
  if (isGreeting(text)) {
    clearSession(userId);
    return {
      message: getWelcomeMessage(),
      state: STATES.MAIN_MENU,
    };
  }

  const session = getSession(userId);
  const input = text.toLowerCase().trim();

  // Handle based on current state
  switch (session.state) {
    case STATES.MAIN_MENU:
      return handleMainMenu(userId, input, text);

    case STATES.QUOTE_CATEGORY:
      return handleQuoteCategory(userId, input, text);

    // Health Insurance Flow
    case STATES.HEALTH_USER_TYPE:
      return handleHealthUserType(userId, input, text);
    case STATES.HEALTH_AGE:
      return handleHealthAge(userId, input, text);
    case STATES.HEALTH_STATE:
      return handleHealthState(userId, input, text);
    case STATES.HEALTH_CONDITIONS:
      return handleHealthConditions(userId, input, text);
    case STATES.HEALTH_PLANS:
      return handleHealthPlans(userId, input, text);

    // Auto Insurance Flow
    case STATES.AUTO_TYPE:
      return handleAutoType(userId, input, text);
    case STATES.AUTO_BRAND:
      return handleAutoBrand(userId, input, text);
    case STATES.AUTO_MODEL:
      return handleAutoModel(userId, input, text);
    case STATES.AUTO_YEAR:
      return handleAutoYear(userId, input, text);
    case STATES.AUTO_VALUE:
      return handleAutoValue(userId, input, text);
    case STATES.AUTO_PLANS:
      return handleAutoPlans(userId, input, text);

    // Device Insurance Flow
    case STATES.DEVICE_TYPE:
      return handleDeviceType(userId, input, text);
    case STATES.DEVICE_BRAND:
      return handleDeviceBrand(userId, input, text);
    case STATES.DEVICE_MODEL:
      return handleDeviceModel(userId, input, text);
    case STATES.DEVICE_CONDITION:
      return handleDeviceCondition(userId, input, text);
    case STATES.DEVICE_VALUE:
      return handleDeviceValue(userId, input, text);
    case STATES.DEVICE_PLANS:
      return handleDevicePlans(userId, input, text);

    // Life Insurance Flow
    case STATES.LIFE_AGE:
      return handleLifeAge(userId, input, text);
    case STATES.LIFE_DEPENDENTS:
      return handleLifeDependents(userId, input, text);
    case STATES.LIFE_SUM:
      return handleLifeSum(userId, input, text);
    case STATES.LIFE_CONDITIONS:
      return handleLifeConditions(userId, input, text);
    case STATES.LIFE_PLANS:
      return handleLifePlans(userId, input, text);

    // Property Insurance Flow
    case STATES.PROPERTY_TYPE:
      return handlePropertyType(userId, input, text);
    case STATES.PROPERTY_STATE:
      return handlePropertyState(userId, input, text);
    case STATES.PROPERTY_VALUE:
      return handlePropertyValue(userId, input, text);
    case STATES.PROPERTY_COVERAGE:
      return handlePropertyCoverage(userId, input, text);
    case STATES.PROPERTY_PLANS:
      return handlePropertyPlans(userId, input, text);

    // Salary Insurance Flow
    case STATES.SALARY_AMOUNT:
      return handleSalaryAmount(userId, input, text);
    case STATES.SALARY_EMPLOYMENT:
      return handleSalaryEmployment(userId, input, text);
    case STATES.SALARY_COVERAGE:
      return handleSalaryCoverage(userId, input, text);
    case STATES.SALARY_PLANS:
      return handleSalaryPlans(userId, input, text);

    // Credit Insurance Flow
    case STATES.CREDIT_AMOUNT:
      return handleCreditAmount(userId, input, text);
    case STATES.CREDIT_DURATION:
      return handleCreditDuration(userId, input, text);
    case STATES.CREDIT_TYPE:
      return handleCreditType(userId, input, text);
    case STATES.CREDIT_PLANS:
      return handleCreditPlans(userId, input, text);

    // Payment Flow
    case STATES.PAYMENT_METHOD:
      return handlePaymentMethod(userId, input, text);
    case STATES.PAYMENT_CONFIRMATION:
      return handlePaymentConfirmation(userId, input, text);

    // Policy Management
    case STATES.POLICY_LOOKUP:
      return handlePolicyLookup(userId, input, text);
    case STATES.POLICY_OPTIONS:
      return handlePolicyOptions(userId, input, text);

    // Claims Flow
    case STATES.CLAIMS_MENU:
      return handleClaimsMenu(userId, input, text);
    case STATES.CLAIM_TYPE:
      return handleClaimType(userId, input, text);
    case STATES.CLAIM_DESCRIPTION:
      return handleClaimDescription(userId, input, text);
    case STATES.CLAIM_LOCATION:
      return handleClaimLocation(userId, input, text);
    case STATES.CLAIM_DOCUMENTS:
      return handleClaimDocuments(userId, input, text);
    case STATES.CLAIM_TRACKING:
      return handleClaimTracking(userId, input, text);

    // Learn Products
    case STATES.LEARN_PRODUCTS:
      return handleLearnProducts(userId, input, text);
    case STATES.PRODUCT_DETAIL:
      return handleProductDetail(userId, input, text);

    // FAQ
    case STATES.FAQ_CATEGORY:
      return handleFAQCategory(userId, input, text);

    // Agent Connection
    case STATES.AGENT_CONNECT:
      return handleAgentConnect(userId, input, text);

    default:
      return {
        message:
          "I didn't understand that. Let me show you the main menu.\n\n" +
          getMainMenu(),
        state: STATES.MAIN_MENU,
      };
  }
}

// Welcome message
function getWelcomeMessage() {
  return `👋 Hello! I'm *CHUKS* — your personal insurance assistant.

I can help you get affordable insurance, manage your policies, make claims, or learn about our products. How can I help you today?

${getMainMenu()}`;
}

// Main menu
function getMainMenu() {
  return `*MAIN MENU*

1️⃣ Get a Quote
2️⃣ Learn About Our Products
3️⃣ Policy Management
4️⃣ Claims & Support
5️⃣ FAQs

_Reply with a number or type what you need._`;
}

// Handle main menu selection
function handleMainMenu(userId, input, text) {
  if (input === "1" || input.includes("quote")) {
    updateSession(userId, STATES.QUOTE_CATEGORY);
    return {
      message: `🎯 *Get a Quote*

What type of insurance would you like a quote for?

1️⃣ Health Insurance
2️⃣ Auto / Car Insurance
3️⃣ Device Insurance
4️⃣ Life Insurance
5️⃣ Property Insurance
6️⃣ Salary Insurance
7️⃣ Credit Insurance
8️⃣ Travel Insurance (Coming Soon)

_Reply with a number or type the insurance name._`,
      state: STATES.QUOTE_CATEGORY,
    };
  }

  if (input === "2" || input.includes("learn") || input.includes("product")) {
    updateSession(userId, STATES.LEARN_PRODUCTS);
    return {
      message: `📚 *Learn About Our Products*

1️⃣ Health Insurance
2️⃣ Auto Insurance
3️⃣ Life Insurance
4️⃣ Device Insurance
5️⃣ Property Insurance
6️⃣ Salary Insurance
7️⃣ Travel Insurance

_Select a product to learn more._`,
      state: STATES.LEARN_PRODUCTS,
    };
  }

  if (input === "3" || input.includes("policy") || input.includes("manage")) {
    updateSession(userId, STATES.POLICY_LOOKUP);
    return {
      message: `🔍 *Policy Management*

Please provide your:
• Policy number, OR
• Registered phone number

I'll look up your policy details.`,
      state: STATES.POLICY_LOOKUP,
    };
  }

  if (input === "4" || input.includes("claim") || input.includes("support")) {
    updateSession(userId, STATES.CLAIMS_MENU);
    return {
      message: `🛟 *Claims & Support*

1️⃣ Make a Claim
2️⃣ Track Claim Status
3️⃣ Speak to an Agent

_How can I help you?_`,
      state: STATES.CLAIMS_MENU,
    };
  }

  if (input === "5" || input.includes("faq") || input.includes("question")) {
    updateSession(userId, STATES.FAQ_CATEGORY);
    return {
      message: `❓ *Frequently Asked Questions*

1️⃣ Health Insurance FAQs
2️⃣ Auto Insurance FAQs
3️⃣ Life Insurance FAQs
4️⃣ Device Insurance FAQs
5️⃣ Payment & Billing FAQs
6️⃣ Claims FAQs
7️⃣ General Insurance Questions

_Which category interests you?_`,
      state: STATES.FAQ_CATEGORY,
    };
  }

  return {
    message: `I didn't quite catch that. ${getMainMenu()}`,
    state: STATES.MAIN_MENU,
  };
}

// Handle quote category selection
function handleQuoteCategory(userId, input, text) {
  if (input === "1" || input.includes("health")) {
    updateSession(userId, STATES.HEALTH_USER_TYPE, { insuranceType: "health" });
    return {
      message: `🏥 *Health Insurance Quote*

Is this insurance for:

1️⃣ Just me
2️⃣ My family

_Please select an option._`,
      state: STATES.HEALTH_USER_TYPE,
    };
  }

  if (input === "2" || input.includes("auto") || input.includes("car")) {
    updateSession(userId, STATES.AUTO_TYPE, { insuranceType: "auto" });
    return {
      message: `🚗 *Auto Insurance Quote*

What type of auto insurance do you want?

1️⃣ Comprehensive
2️⃣ Third-party
3️⃣ Fleet (Business)

_Please select an option._`,
      state: STATES.AUTO_TYPE,
    };
  }

  if (
    input === "3" ||
    input.includes("device") ||
    input.includes("phone") ||
    input.includes("gadget")
  ) {
    updateSession(userId, STATES.DEVICE_TYPE, { insuranceType: "device" });
    return {
      message: `📱 *Device Insurance Quote*

What device do you want to insure?

1️⃣ Phone
2️⃣ Laptop
3️⃣ Tablet

_Please select an option._`,
      state: STATES.DEVICE_TYPE,
    };
  }

  if (input === "4" || input.includes("life")) {
    updateSession(userId, STATES.LIFE_AGE, { insuranceType: "life" });
    return {
      message: `❤️ *Life Insurance Quote*

What is your age?

_Please enter your age in years._`,
      state: STATES.LIFE_AGE,
    };
  }

  if (input === "5" || input.includes("property") || input.includes("home")) {
    updateSession(userId, STATES.PROPERTY_TYPE, { insuranceType: "property" });
    return {
      message: `🏠 *Property Insurance Quote*

What type of property do you want to insure?

1️⃣ House
2️⃣ Shop
3️⃣ Office

_Please select an option._`,
      state: STATES.PROPERTY_TYPE,
    };
  }

  if (input === "6" || input.includes("salary") || input.includes("income")) {
    updateSession(userId, STATES.SALARY_AMOUNT, { insuranceType: "salary" });
    return {
      message: `💰 *Salary Insurance Quote*

What is your monthly salary (in Naira)?

_Example: 150000_`,
      state: STATES.SALARY_AMOUNT,
    };
  }

  if (input === "7" || input.includes("credit") || input.includes("loan")) {
    updateSession(userId, STATES.CREDIT_AMOUNT, { insuranceType: "credit" });
    return {
      message: `💳 *Credit Insurance Quote*

What is your loan amount (in Naira)?

_Example: 500000_`,
      state: STATES.CREDIT_AMOUNT,
    };
  }

  if (input === "8" || input.includes("travel")) {
    return {
      message: `✈️ *Travel Insurance*

Travel insurance is launching soon! 🎉

Would you like to join the early-access list?

1️⃣ Yes, notify me
2️⃣ No, thanks
3️⃣ Back to menu

_Type MENU anytime to return to the main menu._`,
      state: STATES.QUOTE_CATEGORY,
    };
  }

  return {
    message: `I didn't understand that selection. Please choose a number between 1-8, or type MENU to return to the main menu.`,
    state: STATES.QUOTE_CATEGORY,
  };
}

// ============ HEALTH INSURANCE HANDLERS ============

function handleHealthUserType(userId, input, text) {
  const session = getSession(userId);

  if (
    input === "1" ||
    input.includes("just me") ||
    input.includes("myself") ||
    input.includes("individual")
  ) {
    updateSession(userId, STATES.HEALTH_AGE, { userType: "individual" });
    return {
      message: `What is your age?

_Please enter your age in years._`,
      state: STATES.HEALTH_AGE,
    };
  }

  if (
    input === "2" ||
    input.includes("family") ||
    input.includes("dependents")
  ) {
    updateSession(userId, STATES.HEALTH_AGE, { userType: "family" });
    return {
      message: `What is your age?

_Please enter your age in years. We'll ask about family members next._`,
      state: STATES.HEALTH_AGE,
    };
  }

  return {
    message: `Please select either:
1️⃣ Just me
2️⃣ My family`,
    state: STATES.HEALTH_USER_TYPE,
  };
}

function handleHealthAge(userId, input, text) {
  const age = parseInt(text);

  if (isNaN(age) || age < 1 || age > 120) {
    return {
      message: `Please enter a valid age (e.g., 28)`,
      state: STATES.HEALTH_AGE,
    };
  }

  updateSession(userId, STATES.HEALTH_STATE, { age });
  return {
    message: `What state do you currently live in?

_Example: Lagos, Abuja, Port Harcourt, etc._`,
    state: STATES.HEALTH_STATE,
  };
}

function handleHealthState(userId, input, text) {
  updateSession(userId, STATES.HEALTH_CONDITIONS, { state: text });
  return {
    message: `Do you have any pre-existing medical conditions?

1️⃣ Yes
2️⃣ No

_This helps us provide accurate coverage options._`,
    state: STATES.HEALTH_CONDITIONS,
  };
}

function handleHealthConditions(userId, input, text) {
  const hasConditions = input === "1" || input.includes("yes");

  updateSession(userId, STATES.HEALTH_PLANS, { hasConditions });

  const session = getSession(userId);
  const { userType, age, state } = session.data;

  // Simulated API call - replace with actual API
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

  return {
    message,
    state: STATES.HEALTH_PLANS,
  };
}

function handleHealthPlans(userId, input, text) {
  const planNumber = parseInt(input);

  if (planNumber >= 1 && planNumber <= 3) {
    const plans = ["Bronze", "Silver", "Gold"];
    const prices = ["25,000", "45,000", "75,000"];

    updateSession(userId, STATES.PAYMENT_METHOD, {
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

// ============ AUTO INSURANCE HANDLERS ============

function handleAutoType(userId, input, text) {
  let autoType = "";

  if (input === "1" || input.includes("comprehensive")) {
    autoType = "comprehensive";
  } else if (
    input === "2" ||
    input.includes("third") ||
    input.includes("party")
  ) {
    autoType = "third-party";
  } else if (
    input === "3" ||
    input.includes("fleet") ||
    input.includes("business")
  ) {
    autoType = "fleet";
  } else {
    return {
      message: `Please select:
1️⃣ Comprehensive
2️⃣ Third-party
3️⃣ Fleet (Business)`,
      state: STATES.AUTO_TYPE,
    };
  }

  updateSession(userId, STATES.AUTO_BRAND, { autoType });
  return {
    message: `What is your vehicle brand?

_Examples: Toyota, Honda, Mercedes, etc._`,
    state: STATES.AUTO_BRAND,
  };
}

function handleAutoBrand(userId, input, text) {
  updateSession(userId, STATES.AUTO_MODEL, { autoBrand: text });
  return {
    message: `What is the vehicle model?

_Examples: Camry, Accord, C-Class, etc._`,
    state: STATES.AUTO_MODEL,
  };
}

function handleAutoModel(userId, input, text) {
  updateSession(userId, STATES.AUTO_YEAR, { autoModel: text });
  return {
    message: `What year was the vehicle manufactured?

_Example: 2020_`,
    state: STATES.AUTO_YEAR,
  };
}

function handleAutoYear(userId, input, text) {
  const year = parseInt(text);

  if (isNaN(year) || year < 1980 || year > new Date().getFullYear() + 1) {
    return {
      message: `Please enter a valid year (e.g., 2020)`,
      state: STATES.AUTO_YEAR,
    };
  }

  updateSession(userId, STATES.AUTO_VALUE, { autoYear: year });
  return {
    message: `What is the estimated value of your vehicle (in Naira)?

_Example: 5000000_`,
    state: STATES.AUTO_VALUE,
  };
}

function handleAutoValue(userId, input, text) {
  const value = parseInt(text.replace(/,/g, ""));

  if (isNaN(value) || value < 100000) {
    return {
      message: `Please enter a valid amount (e.g., 5000000)`,
      state: STATES.AUTO_VALUE,
    };
  }

  updateSession(userId, STATES.AUTO_PLANS, { autoValue: value });

  const session = getSession(userId);
  const { autoType, autoBrand, autoModel, autoYear } = session.data;

  // Simulated premium calculation
  const premium = Math.round(value * 0.05).toLocaleString();

  let message = `✅ *Your Auto Insurance Quote*\n\n`;
  message += `Vehicle: ${autoYear} ${autoBrand} ${autoModel}\n`;
  message += `Type: ${autoType}\n`;
  message += `Value: ₦${value.toLocaleString()}\n\n`;
  message += `*Annual Premium: ₦${premium}*\n\n`;
  message += `Coverage includes:\n`;
  message += `• Accident damage\n`;
  message += `• Fire & theft\n`;
  message += `• Third-party liability\n`;
  message += `• Roadside assistance\n`;
  message += `• Access to certified workshops\n\n`;
  message += `Would you like to proceed?\n\n`;
  message += `1️⃣ Yes, buy now\n`;
  message += `2️⃣ Save quote\n`;
  message += `3️⃣ Back to menu`;

  return {
    message,
    state: STATES.AUTO_PLANS,
  };
}

function handleAutoPlans(userId, input, text) {
  if (input === "1" || input.includes("yes") || input.includes("buy")) {
    updateSession(userId, STATES.PAYMENT_METHOD);
    return getPaymentOptions(userId);
  }

  if (input === "2" || input.includes("save")) {
    return {
      message: `✅ Quote saved! I'll send you a reminder in 24 hours.

Type MENU to return to the main menu.`,
      state: STATES.MAIN_MENU,
    };
  }

  if (input === "3" || input.includes("menu")) {
    updateSession(userId, STATES.MAIN_MENU);
    return {
      message: getMainMenu(),
      state: STATES.MAIN_MENU,
    };
  }

  return {
    message: `Please select 1, 2, or 3.`,
    state: STATES.AUTO_PLANS,
  };
}

// ============ DEVICE INSURANCE HANDLERS ============

function handleDeviceType(userId, input, text) {
  let deviceType = "";

  if (input === "1" || input.includes("phone")) {
    deviceType = "phone";
  } else if (input === "2" || input.includes("laptop")) {
    deviceType = "laptop";
  } else if (input === "3" || input.includes("tablet")) {
    deviceType = "tablet";
  } else {
    return {
      message: `Please select:
1️⃣ Phone
2️⃣ Laptop
3️⃣ Tablet`,
      state: STATES.DEVICE_TYPE,
    };
  }

  updateSession(userId, STATES.DEVICE_BRAND, { deviceType });
  return {
    message: `What is the brand of your ${deviceType}?

_Examples: Apple, Samsung, HP, Dell, etc._`,
    state: STATES.DEVICE_BRAND,
  };
}

function handleDeviceBrand(userId, input, text) {
  updateSession(userId, STATES.DEVICE_MODEL, { deviceBrand: text });
  return {
    message: `What is the model?

_Examples: iPhone 14, Galaxy S23, MacBook Pro, etc._`,
    state: STATES.DEVICE_MODEL,
  };
}

function handleDeviceModel(userId, input, text) {
  updateSession(userId, STATES.DEVICE_CONDITION, { deviceModel: text });
  return {
    message: `Is your device new or used?

1️⃣ New
2️⃣ Used`,
    state: STATES.DEVICE_CONDITION,
  };
}

function handleDeviceCondition(userId, input, text) {
  const condition = input === "1" || input.includes("new") ? "new" : "used";

  updateSession(userId, STATES.DEVICE_VALUE, { deviceCondition: condition });
  return {
    message: `How much did the device cost (in Naira)?

_Example: 350000_`,
    state: STATES.DEVICE_VALUE,
  };
}

function handleDeviceValue(userId, input, text) {
  const value = parseInt(text.replace(/,/g, ""));

  if (isNaN(value) || value < 10000) {
    return {
      message: `Please enter a valid amount (e.g., 350000)`,
      state: STATES.DEVICE_VALUE,
    };
  }

  updateSession(userId, STATES.DEVICE_PLANS, { deviceValue: value });

  const session = getSession(userId);
  const { deviceType, deviceBrand, deviceModel, deviceCondition } =
    session.data;

  // Simulated premium calculation
  const premium = Math.round(value * 0.08).toLocaleString();

  let message = `✅ *Your Device Insurance Quote*\n\n`;
  message += `Device: ${deviceBrand} ${deviceModel}\n`;
  message += `Type: ${deviceType}\n`;
  message += `Condition: ${deviceCondition}\n`;
  message += `Value: ₦${value.toLocaleString()}\n\n`;
  message += `*Annual Premium: ₦${premium}*\n\n`;
  message += `Coverage includes:\n`;
  message += `• Screen damage\n`;
  message += `• Theft protection\n`;
  message += `• Liquid damage\n`;
  message += `• Worldwide coverage\n\n`;
  message += `Would you like to proceed?\n\n`;
  message += `1️⃣ Yes, buy now\n`;
  message += `2️⃣ Save quote\n`;
  message += `3️⃣ Back to menu`;

  return {
    message,
    state: STATES.DEVICE_PLANS,
  };
}

function handleDevicePlans(userId, input, text) {
  if (input === "1" || input.includes("yes") || input.includes("buy")) {
    updateSession(userId, STATES.PAYMENT_METHOD);
    return getPaymentOptions(userId);
  }

  if (input === "2" || input.includes("save")) {
    return {
      message: `✅ Quote saved! I'll send you a reminder in 24 hours.

Type MENU to return to the main menu.`,
      state: STATES.MAIN_MENU,
    };
  }

  if (input === "3" || input.includes("menu")) {
    updateSession(userId, STATES.MAIN_MENU);
    return {
      message: getMainMenu(),
      state: STATES.MAIN_MENU,
    };
  }

  return {
    message: `Please select 1, 2, or 3.`,
    state: STATES.DEVICE_PLANS,
  };
}

// ============ LIFE INSURANCE HANDLERS ============

function handleLifeAge(userId, input, text) {
  const age = parseInt(text);

  if (isNaN(age) || age < 18 || age > 100) {
    return {
      message: `Please enter a valid age between 18 and 100.`,
      state: STATES.LIFE_AGE,
    };
  }

  updateSession(userId, STATES.LIFE_DEPENDENTS, { age });
  return {
    message: `Do you have any dependents?

1️⃣ Yes
2️⃣ No`,
    state: STATES.LIFE_DEPENDENTS,
  };
}

function handleLifeDependents(userId, input, text) {
  const hasDependents = input === "1" || input.includes("yes");

  updateSession(userId, STATES.LIFE_SUM, { hasDependents });
  return {
    message: `What sum insured would you prefer (in Naira)?

_This is the amount your beneficiaries will receive._

Examples:
• 1000000 (₦1M)
• 5000000 (₦5M)
• 10000000 (₦10M)`,
    state: STATES.LIFE_SUM,
  };
}

function handleLifeSum(userId, input, text) {
  const sumInsured = parseInt(text.replace(/,/g, ""));

  if (isNaN(sumInsured) || sumInsured < 500000) {
    return {
      message: `Please enter a valid amount (minimum ₦500,000)`,
      state: STATES.LIFE_SUM,
    };
  }

  updateSession(userId, STATES.LIFE_CONDITIONS, { sumInsured });
  return {
    message: `Do you have any serious medical conditions?

1️⃣ Yes
2️⃣ No

_This helps us provide accurate coverage._`,
    state: STATES.LIFE_CONDITIONS,
  };
}

function handleLifeConditions(userId, input, text) {
  const hasConditions = input === "1" || input.includes("yes");

  updateSession(userId, STATES.LIFE_PLANS, { hasConditions });

  const session = getSession(userId);
  const { age, hasDependents, sumInsured } = session.data;

  // Simulated premium calculation
  const monthlyPremium = Math.round(sumInsured * 0.001 + age * 100);

  let message = `✅ *Your Life Insurance Quote*\n\n`;
  message += `Age: ${age}\n`;
  message += `Dependents: ${hasDependents ? "Yes" : "No"}\n`;
  message += `Sum Insured: ₦${sumInsured.toLocaleString()}\n\n`;
  message += `*Monthly Premium: ₦${monthlyPremium.toLocaleString()}*\n\n`;
  message += `Coverage includes:\n`;
  message += `• Death benefit payout\n`;
  message += `• Terminal illness cover\n`;
  message += `• Flexible premium payments\n`;
  message += `• Investment options\n\n`;
  message += `Would you like to proceed?\n\n`;
  message += `1️⃣ Yes, buy now\n`;
  message += `2️⃣ Save quote\n`;
  message += `3️⃣ Back to menu`;

  return {
    message,
    state: STATES.LIFE_PLANS,
  };
}

function handleLifePlans(userId, input, text) {
  if (input === "1" || input.includes("yes") || input.includes("buy")) {
    updateSession(userId, STATES.PAYMENT_METHOD);
    return getPaymentOptions(userId);
  }

  if (input === "2" || input.includes("save")) {
    return {
      message: `✅ Quote saved! I'll send you a reminder in 24 hours.

Type MENU to return to the main menu.`,
      state: STATES.MAIN_MENU,
    };
  }

  if (input === "3" || input.includes("menu")) {
    updateSession(userId, STATES.MAIN_MENU);
    return {
      message: getMainMenu(),
      state: STATES.MAIN_MENU,
    };
  }

  return {
    message: `Please select 1, 2, or 3.`,
    state: STATES.LIFE_PLANS,
  };
}

// ============ PROPERTY INSURANCE HANDLERS ============

function handlePropertyType(userId, input, text) {
  let propertyType = "";

  if (input === "1" || input.includes("house") || input.includes("home")) {
    propertyType = "house";
  } else if (
    input === "2" ||
    input.includes("shop") ||
    input.includes("store")
  ) {
    propertyType = "shop";
  } else if (input === "3" || input.includes("office")) {
    propertyType = "office";
  } else {
    return {
      message: `Please select:
1️⃣ House
2️⃣ Shop
3️⃣ Office`,
      state: STATES.PROPERTY_TYPE,
    };
  }

  updateSession(userId, STATES.PROPERTY_STATE, { propertyType });
  return {
    message: `What state is the property located in?

_Example: Lagos, Abuja, etc._`,
    state: STATES.PROPERTY_STATE,
  };
}

function handlePropertyState(userId, input, text) {
  updateSession(userId, STATES.PROPERTY_VALUE, { propertyState: text });
  return {
    message: `What is the estimated value of the property (in Naira)?

_Example: 15000000_`,
    state: STATES.PROPERTY_VALUE,
  };
}

function handlePropertyValue(userId, input, text) {
  const value = parseInt(text.replace(/,/g, ""));

  if (isNaN(value) || value < 500000) {
    return {
      message: `Please enter a valid amount (e.g., 15000000)`,
      state: STATES.PROPERTY_VALUE,
    };
  }

  updateSession(userId, STATES.PROPERTY_COVERAGE, { propertyValue: value });
  return {
    message: `What coverage do you need?

1️⃣ Fire only
2️⃣ Fire & Theft
3️⃣ Fire, Theft & Flood
4️⃣ All-risk (Comprehensive)`,
    state: STATES.PROPERTY_COVERAGE,
  };
}

function handlePropertyCoverage(userId, input, text) {
  let coverage = "";
  let coverageMultiplier = 1;

  if (input === "1" || input.includes("fire only")) {
    coverage = "Fire only";
    coverageMultiplier = 0.002;
  } else if (input === "2" || input.includes("theft")) {
    coverage = "Fire & Theft";
    coverageMultiplier = 0.003;
  } else if (input === "3" || input.includes("flood")) {
    coverage = "Fire, Theft & Flood";
    coverageMultiplier = 0.004;
  } else if (
    input === "4" ||
    input.includes("all") ||
    input.includes("comprehensive")
  ) {
    coverage = "All-risk";
    coverageMultiplier = 0.005;
  } else {
    return {
      message: `Please select 1, 2, 3, or 4.`,
      state: STATES.PROPERTY_COVERAGE,
    };
  }

  updateSession(userId, STATES.PROPERTY_PLANS, { propertyCoverage: coverage });

  const session = getSession(userId);
  const { propertyType, propertyState, propertyValue } = session.data;

  // Simulated premium calculation
  const premium = Math.round(
    propertyValue * coverageMultiplier
  ).toLocaleString();

  let message = `✅ *Your Property Insurance Quote*\n\n`;
  message += `Property Type: ${propertyType}\n`;
  message += `Location: ${propertyState}\n`;
  message += `Value: ₦${propertyValue.toLocaleString()}\n`;
  message += `Coverage: ${coverage}\n\n`;
  message += `*Annual Premium: ₦${premium}*\n\n`;
  message += `Would you like to proceed?\n\n`;
  message += `1️⃣ Yes, buy now\n`;
  message += `2️⃣ Save quote\n`;
  message += `3️⃣ Back to menu`;

  return {
    message,
    state: STATES.PROPERTY_PLANS,
  };
}

function handlePropertyPlans(userId, input, text) {
  if (input === "1" || input.includes("yes") || input.includes("buy")) {
    updateSession(userId, STATES.PAYMENT_METHOD);
    return getPaymentOptions(userId);
  }

  if (input === "2" || input.includes("save")) {
    return {
      message: `✅ Quote saved! I'll send you a reminder in 24 hours.

Type MENU to return to the main menu.`,
      state: STATES.MAIN_MENU,
    };
  }

  if (input === "3" || input.includes("menu")) {
    updateSession(userId, STATES.MAIN_MENU);
    return {
      message: getMainMenu(),
      state: STATES.MAIN_MENU,
    };
  }

  return {
    message: `Please select 1, 2, or 3.`,
    state: STATES.PROPERTY_PLANS,
  };
}

// ============ SALARY INSURANCE HANDLERS ============

function handleSalaryAmount(userId, input, text) {
  const salary = parseInt(text.replace(/,/g, ""));

  if (isNaN(salary) || salary < 50000) {
    return {
      message: `Please enter a valid monthly salary (e.g., 150000)`,
      state: STATES.SALARY_AMOUNT,
    };
  }

  updateSession(userId, STATES.SALARY_EMPLOYMENT, { salary });
  return {
    message: `What is your employment type?

1️⃣ Permanent/Full-time
2️⃣ Contract
3️⃣ Self-employed`,
    state: STATES.SALARY_EMPLOYMENT,
  };
}

function handleSalaryEmployment(userId, input, text) {
  let employmentType = "";

  if (input === "1" || input.includes("permanent") || input.includes("full")) {
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

  updateSession(userId, STATES.SALARY_COVERAGE, { employmentType });
  return {
    message: `What coverage do you need?

1️⃣ Illness only
2️⃣ Job loss only
3️⃣ Disability only
4️⃣ Comprehensive (All of the above)`,
    state: STATES.SALARY_COVERAGE,
  };
}

function handleSalaryCoverage(userId, input, text) {
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

  updateSession(userId, STATES.SALARY_PLANS, { salaryCoverage: coverage });

  return {
    message: `🚧 *Salary Insurance - Coming Soon*

This product is currently under development.

Would you like to:
1️⃣ Join the waitlist
2️⃣ Back to menu`,
    state: STATES.SALARY_PLANS,
  };
}

function handleSalaryPlans(userId, input, text) {
  if (input === "1" || input.includes("join") || input.includes("waitlist")) {
    return {
      message: `✅ Great! You've been added to the waitlist. We'll notify you as soon as Salary Insurance is available.

Type MENU to return to the main menu.`,
      state: STATES.MAIN_MENU,
    };
  }

  if (input === "2" || input.includes("menu") || input.includes("back")) {
    updateSession(userId, STATES.MAIN_MENU);
    return {
      message: getMainMenu(),
      state: STATES.MAIN_MENU,
    };
  }

  return {
    message: `Please select 1 or 2.`,
    state: STATES.SALARY_PLANS,
  };
}

// ============ CREDIT INSURANCE HANDLERS ============

function handleCreditAmount(userId, input, text) {
  const amount = parseInt(text.replace(/,/g, ""));

  if (isNaN(amount) || amount < 100000) {
    return {
      message: `Please enter a valid loan amount (e.g., 500000)`,
      state: STATES.CREDIT_AMOUNT,
    };
  }

  updateSession(userId, STATES.CREDIT_DURATION, { creditAmount: amount });
  return {
    message: `What is the loan duration (in months)?

_Example: 12, 24, 36, etc._`,
    state: STATES.CREDIT_DURATION,
  };
}

function handleCreditDuration(userId, input, text) {
  const duration = parseInt(text);

  if (isNaN(duration) || duration < 3 || duration > 120) {
    return {
      message: `Please enter a valid duration between 3 and 120 months.`,
      state: STATES.CREDIT_DURATION,
    };
  }

  updateSession(userId, STATES.CREDIT_TYPE, { creditDuration: duration });
  return {
    message: `What type of loan is this?

1️⃣ Personal loan
2️⃣ Business loan
3️⃣ Mortgage`,
    state: STATES.CREDIT_TYPE,
  };
}

function handleCreditType(userId, input, text) {
  let loanType = "";

  if (input === "1" || input.includes("personal")) {
    loanType = "Personal";
  } else if (input === "2" || input.includes("business")) {
    loanType = "Business";
  } else if (input === "3" || input.includes("mortgage")) {
    loanType = "Mortgage";
  } else {
    return {
      message: `Please select 1, 2, or 3.`,
      state: STATES.CREDIT_TYPE,
    };
  }

  updateSession(userId, STATES.CREDIT_PLANS, { loanType });

  const session = getSession(userId);
  const { creditAmount, creditDuration } = session.data;

  // Simulated premium calculation
  const premium = Math.round(
    (creditAmount * 0.02) / creditDuration
  ).toLocaleString();
  const totalPremium = Math.round(creditAmount * 0.02).toLocaleString();

  let message = `✅ *Your Credit Insurance Quote*\n\n`;
  message += `Loan Amount: ₦${creditAmount.toLocaleString()}\n`;
  message += `Duration: ${creditDuration} months\n`;
  message += `Type: ${loanType}\n\n`;
  message += `*Monthly Premium: ₦${premium}*\n`;
  message += `Total Premium: ₦${totalPremium}\n\n`;
  message += `Coverage includes:\n`;
  message += `• Death benefit\n`;
  message += `• Disability cover\n`;
  message += `• Job loss protection\n\n`;
  message += `Would you like to proceed?\n\n`;
  message += `1️⃣ Yes, buy now\n`;
  message += `2️⃣ Save quote\n`;
  message += `3️⃣ Back to menu`;

  return {
    message,
    state: STATES.CREDIT_PLANS,
  };
}

function handleCreditPlans(userId, input, text) {
  if (input === "1" || input.includes("yes") || input.includes("buy")) {
    updateSession(userId, STATES.PAYMENT_METHOD);
    return getPaymentOptions(userId);
  }

  if (input === "2" || input.includes("save")) {
    return {
      message: `✅ Quote saved! I'll send you a reminder in 24 hours.

Type MENU to return to the main menu.`,
      state: STATES.MAIN_MENU,
    };
  }

  if (input === "3" || input.includes("menu")) {
    updateSession(userId, STATES.MAIN_MENU);
    return {
      message: getMainMenu(),
      state: STATES.MAIN_MENU,
    };
  }

  return {
    message: `Please select 1, 2, or 3.`,
    state: STATES.CREDIT_PLANS,
  };
}

// ============ PAYMENT HANDLERS ============

function getPaymentOptions(userId) {
  const session = getSession(userId);
  const premium = session.data.premium || "XX,XXX";

  return {
    message: `💳 *Payment Options*

Your premium: ₦${premium}

How would you like to pay?

1️⃣ Pay Online (Card/Bank)
2️⃣ Bank Transfer
3️⃣ USSD

_Select your preferred payment method._`,
    state: STATES.PAYMENT_METHOD,
  };
}

function handlePaymentMethod(userId, input, text) {
  if (input === "1" || input.includes("online") || input.includes("card")) {
    // Generate payment link (simulated)
    const paymentLink = "https://pay.skydd.com/xxxxx";

    updateSession(userId, STATES.PAYMENT_CONFIRMATION);
    return {
      message: `💳 *Pay Online*

Click the link below to complete your payment:
${paymentLink}

After payment, your policy will be activated immediately.

✅ I've completed payment
❌ Cancel`,
      state: STATES.PAYMENT_CONFIRMATION,
    };
  }

  if (input === "2" || input.includes("transfer")) {
    updateSession(userId, STATES.PAYMENT_CONFIRMATION);
    return {
      message: `🏦 *Bank Transfer*

Transfer to:
Bank: GTBank
Account: 0123456789
Name: Skydd Insurance Ltd

After transfer, please reply with:
"PAID" + your transaction reference

Or upload proof of payment.`,
      state: STATES.PAYMENT_CONFIRMATION,
    };
  }

  if (input === "3" || input.includes("ussd")) {
    updateSession(userId, STATES.PAYMENT_CONFIRMATION);
    return {
      message: `📱 *USSD Payment*

Dial: *737*50*Amount*AccountNumber#

Example: *737*50*25000*0123456789#

After payment, reply "DONE"`,
      state: STATES.PAYMENT_CONFIRMATION,
    };
  }

  return {
    message: `Please select 1, 2, or 3.`,
    state: STATES.PAYMENT_METHOD,
  };
}

function handlePaymentConfirmation(userId, input, text) {
  if (
    input.includes("paid") ||
    input.includes("done") ||
    input.includes("completed")
  ) {
    // Simulate policy issuance
    const policyNumber = "SKY" + Date.now().toString().slice(-8);
    const effectiveDate = new Date().toLocaleDateString();

    clearSession(userId);

    return {
      message: `🎉 *Payment Successful!*

Your policy is now active!

📋 *Policy Details:*
Policy Number: ${policyNumber}
Effective Date: ${effectiveDate}

📄 Your policy document has been sent to your email.

*What's Next?*
• Download your policy certificate
• Add beneficiaries (for life insurance)
• Contact us anytime for support

Type MENU for more options or HELP for assistance.`,
      state: STATES.MAIN_MENU,
    };
  }

  if (input.includes("cancel")) {
    updateSession(userId, STATES.MAIN_MENU);
    return {
      message: `Payment cancelled. ${getMainMenu()}`,
      state: STATES.MAIN_MENU,
    };
  }

  return {
    message: `Please reply with "PAID" after completing payment, or "CANCEL" to go back.`,
    state: STATES.PAYMENT_CONFIRMATION,
  };
}

// ============ POLICY MANAGEMENT HANDLERS ============

function handlePolicyLookup(userId, input, text) {
  // Simulate API lookup
  const mockPolicy = {
    number: "SKY12345678",
    type: "Health Insurance",
    status: "Active",
    renewal: "2025-12-31",
    premium: "45,000",
  };

  updateSession(userId, STATES.POLICY_OPTIONS, { policy: mockPolicy });

  return {
    message: `✅ *Policy Found*

Policy Number: ${mockPolicy.number}
Type: ${mockPolicy.type}
Status: ${mockPolicy.status}
Renewal Date: ${mockPolicy.renewal}
Premium: ₦${mockPolicy.premium}/month

What would you like to do?

1️⃣ View full policy details
2️⃣ Download policy document
3️⃣ Pay renewal
4️⃣ Update information
5️⃣ Back to menu`,
    state: STATES.POLICY_OPTIONS,
  };
}

function handlePolicyOptions(userId, input, text) {
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
    updateSession(userId, STATES.PAYMENT_METHOD);
    return getPaymentOptions(userId);
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
    updateSession(userId, STATES.MAIN_MENU);
    return {
      message: getMainMenu(),
      state: STATES.MAIN_MENU,
    };
  }

  return {
    message: `Please select an option (1-5).`,
    state: STATES.POLICY_OPTIONS,
  };
}

// ============ CLAIMS HANDLERS ============

function handleClaimsMenu(userId, input, text) {
  if (input === "1" || input.includes("make") || input.includes("file")) {
    updateSession(userId, STATES.CLAIM_TYPE);
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
    updateSession(userId, STATES.CLAIM_TRACKING);
    return {
      message: `🔍 *Track Your Claim*

Please provide your Claim ID.

_Example: CLM12345_`,
      state: STATES.CLAIM_TRACKING,
    };
  }

  if (input === "3" || input.includes("agent") || input.includes("speak")) {
    updateSession(userId, STATES.AGENT_CONNECT);
    return {
      message: `👤 *Connect with an Agent*

I'm connecting you with one of our support agents.

Please briefly describe your issue:`,
      state: STATES.AGENT_CONNECT,
    };
  }

  return {
    message: `Please select 1, 2, or 3.`,
    state: STATES.CLAIMS_MENU,
  };
}

function handleClaimType(userId, input, text) {
  let claimType = "";

  if (input === "1") claimType = "Health";
  else if (input === "2") claimType = "Auto";
  else if (input === "3") claimType = "Device";
  else if (input === "4") claimType = "Life";
  else if (input === "5") claimType = "Property";
  else {
    return {
      message: `Please select a number between 1-5.`,
      state: STATES.CLAIM_TYPE,
    };
  }

  updateSession(userId, STATES.CLAIM_DESCRIPTION, { claimType });
  return {
    message: `📝 *${claimType} Insurance Claim*

Please describe what happened:

_Be as detailed as possible._`,
    state: STATES.CLAIM_DESCRIPTION,
  };
}

function handleClaimDescription(userId, input, text) {
  updateSession(userId, STATES.CLAIM_LOCATION, { claimDescription: text });
  return {
    message: `📍 Where did this happen?

_Please provide the location._`,
    state: STATES.CLAIM_LOCATION,
  };
}

function handleClaimLocation(userId, input, text) {
  updateSession(userId, STATES.CLAIM_DOCUMENTS, { claimLocation: text });
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

function handleClaimDocuments(userId, input, text) {
  if (input.includes("done") || input.includes("skip")) {
    const claimId = "CLM" + Date.now().toString().slice(-6);

    clearSession(userId);

    return {
      message: `✅ *Claim Submitted Successfully*

Your Claim ID: *${claimId}*

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
    message: `Please reply "DONE" when finished uploading, or "SKIP" to continue without documents.`,
    state: STATES.CLAIM_DOCUMENTS,
  };
}

function handleClaimTracking(userId, input, text) {
  // Simulate claim lookup
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

// ============ LEARN PRODUCTS HANDLERS ============

function handleLearnProducts(userId, input, text) {
  const products = {
    1: "Health Insurance",
    2: "Auto Insurance",
    3: "Life Insurance",
    4: "Device Insurance",
    5: "Property Insurance",
    6: "Salary Insurance",
    7: "Travel Insurance",
  };

  const productName = products[input];

  if (!productName) {
    return {
      message: `Please select a number between 1-7.`,
      state: STATES.LEARN_PRODUCTS,
    };
  }

  updateSession(userId, STATES.PRODUCT_DETAIL, {
    selectedProduct: productName,
  });

  let message = "";

  switch (input) {
    case "1":
      message = `🏥 *Health Insurance*

*Overview:*
Comprehensive medical coverage for you and your family.

*What it covers:*
• Hospital bills & surgeries
• Outpatient consultations
• Prescription medications
• Diagnostic tests & scans
• Dental & optical (optional)
• Maternity care
• Emergency ambulance

*Who should buy it:*
• Everyone! Medical emergencies can happen anytime
• Families with children
• People with chronic conditions
• Senior citizens

*Price Range:*
From ₦25,000/year (individual) to ₦120,000/year (family)

Would you like to:
1️⃣ Get a quote
2️⃣ Back to products
3️⃣ Main menu`;
      break;

    case "2":
      message = `🚗 *Auto Insurance*

*Overview:*
Protection for your vehicle against accidents, theft, and damage.

*What it covers:*
• Accident repairs
• Fire & theft
• Third-party liability
• Windscreen damage
• Flood damage
• Towing & roadside assistance
• Access to approved workshops

*Who should buy it:*
• All vehicle owners (required by law)
• Commercial vehicle operators
• Fleet owners

*Price Range:*
From ₦15,000/year (third-party) to 5% of vehicle value (comprehensive)

Would you like to:
1️⃣ Get a quote
2️⃣ Back to products
3️⃣ Main menu`;
      break;

    case "3":
      message = `❤️ *Life Insurance*

*Overview:*
Financial security for your loved ones when you're gone.

*What it covers:*
• Death benefit payout
• Terminal illness cover
• Permanent disability
• Funeral expenses
• Estate planning support

*Who should buy it:*
• Breadwinners with dependents
• Parents with young children
• Business owners
• Anyone wanting to leave a legacy

*Price Range:*
From ₦10,000/month (₦1M coverage) to ₦100,000/month (₦20M+ coverage)

Would you like to:
1️⃣ Get a quote
2️⃣ Back to products
3️⃣ Main menu`;
      break;

    case "4":
      message = `📱 *Device Insurance*

*Overview:*
Protect your phones, laptops, and tablets from damage and theft.

*What it covers:*
• Cracked/broken screens
• Liquid damage
• Theft & robbery
• Hardware malfunction
• Worldwide coverage

*Who should buy it:*
• Smartphone owners (especially flagship devices)
• Remote workers with laptops
• Frequent travelers
• Students with devices

*Price Range:*
From ₦3,000/year (basic phones) to ₦15,000/year (premium devices)

Would you like to:
1️⃣ Get a quote
2️⃣ Back to products
3️⃣ Main menu`;
      break;

    case "5":
      message = `🏠 *Property Insurance*

*Overview:*
Coverage for your home, shop, or office against various risks.

*What it covers:*
• Fire damage
• Theft & burglary
• Flood & natural disasters
• Vandalism
• Building & contents
• Business interruption (for commercial)

*Who should buy it:*
• Homeowners
• Landlords
• Shop/business owners
• Office tenants

*Price Range:*
From ₦30,000/year (basic fire) to 0.5% of property value (all-risk)

Would you like to:
1️⃣ Get a quote
2️⃣ Back to products
3️⃣ Main menu`;
      break;

    case "6":
      message = `💰 *Salary Insurance*

*Overview:*
Income protection when you can't work due to illness, job loss, or disability.

*What it covers:*
• Monthly salary replacement (up to 6-12 months)
• Coverage for illness/injury
• Job loss protection
• Disability benefits

*Who should buy it:*
• Salaried employees
• Contract workers
• Self-employed professionals
• Single-income households

*Status:* 🚧 Coming Soon

Would you like to:
1️⃣ Join waitlist
2️⃣ Back to products
3️⃣ Main menu`;
      break;

    case "7":
      message = `✈️ *Travel Insurance*

*Overview:*
Protection when traveling domestically or internationally.

*What it covers:*
• Medical emergencies abroad
• Trip cancellation/interruption
• Lost/delayed luggage
• Flight delays
• Emergency evacuation
• Personal liability

*Who should buy it:*
• International travelers
• Business travelers
• Adventure seekers
• Family vacationers

*Status:* 🚧 Coming Soon

Would you like to:
1️⃣ Join waitlist
2️⃣ Back to products
3️⃣ Main menu`;
      break;
  }

  return {
    message,
    state: STATES.PRODUCT_DETAIL,
  };
}

function handleProductDetail(userId, input, text) {
  if (input === "1" || input.includes("quote")) {
    updateSession(userId, STATES.QUOTE_CATEGORY);
    return {
      message: `Great! Let's get you a quote.

What type of insurance?

1️⃣ Health Insurance
2️⃣ Auto / Car Insurance
3️⃣ Device Insurance
4️⃣ Life Insurance
5️⃣ Property Insurance
6️⃣ Salary Insurance
7️⃣ Credit Insurance`,
      state: STATES.QUOTE_CATEGORY,
    };
  }

  if (input === "2" || input.includes("back") || input.includes("products")) {
    updateSession(userId, STATES.LEARN_PRODUCTS);
    return {
      message: `📚 *Learn About Our Products*

1️⃣ Health Insurance
2️⃣ Auto Insurance
3️⃣ Life Insurance
4️⃣ Device Insurance
5️⃣ Property Insurance
6️⃣ Salary Insurance
7️⃣ Travel Insurance

Select a product to learn more.`,
      state: STATES.LEARN_PRODUCTS,
    };
  }

  if (input === "3" || input.includes("menu")) {
    updateSession(userId, STATES.MAIN_MENU);
    return {
      message: getMainMenu(),
      state: STATES.MAIN_MENU,
    };
  }

  return {
    message: `Please select 1, 2, or 3.`,
    state: STATES.PRODUCT_DETAIL,
  };
}

// ============ FAQ HANDLERS ============

function handleFAQCategory(userId, input, text) {
  const faqs = {
    1: {
      title: "Health Insurance FAQs",
      questions: [
        "Q: What does health insurance cover?\nA: Hospital bills, outpatient care, medications, diagnostic tests, and more.",
        "Q: Can I add family members?\nA: Yes, you can add spouse and children to your plan.",
        "Q: Are pre-existing conditions covered?\nA: Some conditions may have waiting periods. Contact us for details.",
        "Q: How do I make a claim?\nA: Visit any partner hospital or submit receipts through our claims portal.",
      ],
    },
    2: {
      title: "Auto Insurance FAQs",
      questions: [
        "Q: What's the difference between comprehensive and third-party?\nA: Comprehensive covers your car + others. Third-party only covers others.",
        "Q: What's not covered?\nA: Wear and tear, driving under influence, unlicensed drivers.",
        "Q: How long does claims take?\nA: 5-10 business days after inspection.",
        "Q: Do I need to renew?\nA: Yes, annually before expiry date.",
      ],
    },
    3: {
      title: "Life Insurance FAQs",
      questions: [
        "Q: Who receives the payout?\nA: Your named beneficiaries.",
        "Q: When does coverage start?\nA: Immediately after payment and approval.",
        "Q: Can I change beneficiaries?\nA: Yes, anytime through our portal.",
        "Q: What if I miss a payment?\nA: You have a 30-day grace period.",
      ],
    },
    4: {
      title: "Device Insurance FAQs",
      questions: [
        "Q: Are used devices covered?\nA: Yes, if less than 2 years old.",
        "Q: How many claims can I make?\nA: Up to 2 per year.",
        "Q: What about stolen devices?\nA: Covered with police report.",
        "Q: Repair or replacement?\nA: Repair first, replacement if unrepairable.",
      ],
    },
    5: {
      title: "Payment & Billing FAQs",
      questions: [
        "Q: Payment methods?\nA: Card, transfer, USSD, or installments.",
        "Q: Can I pay monthly?\nA: Yes, for most products.",
        "Q: Refund policy?\nA: Available within 14 days if no claims made.",
        "Q: Discounts available?\nA: Yes, for annual payments and multiple policies.",
      ],
    },
    6: {
      title: "Claims FAQs",
      questions: [
        "Q: How long do claims take?\nA: 3-10 business days depending on type.",
        "Q: What documents needed?\nA: Policy number, incident description, supporting docs.",
        "Q: Can I track my claim?\nA: Yes, using your claim ID.",
        "Q: What if claim is denied?\nA: You can appeal with additional evidence.",
      ],
    },
    7: {
      title: "General Insurance Questions",
      questions: [
        "Q: How do I cancel my policy?\nA: Contact us 30 days before renewal.",
        "Q: Can I upgrade my plan?\nA: Yes, at any time with price adjustment.",
        "Q: What is a premium?\nA: The amount you pay for insurance coverage.",
        "Q: Do you have agents?\nA: Yes, contact us to speak with an agent.",
      ],
    },
  };

  const faq = faqs[input];

  if (!faq) {
    return {
      message: `Please select a number between 1-7.`,
      state: STATES.FAQ_CATEGORY,
    };
  }

  let message = `❓ *${faq.title}*\n\n`;
  faq.questions.forEach((q, i) => {
    message += `${i + 1}. ${q}\n\n`;
  });
  message += `\nType MENU to return to main menu or ask another question.`;

  return {
    message,
    state: STATES.FAQ_CATEGORY,
  };
}

// ============ AGENT CONNECTION HANDLER ============

function handleAgentConnect(userId, input, text) {
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

// ============ API HELPER FUNCTIONS ============

// These functions would make actual API calls in production
async function fetchHealthQuote(userData) {
  // Call your backend API
  // const response = await axios.post('/api/quotes/health', userData);
  // return response.data;
  return {
    plans: [
      { name: "Bronze", price: 25000 },
      { name: "Silver", price: 45000 },
      { name: "Gold", price: 75000 },
    ],
  };
}

async function fetchAutoQuote(userData) {
  return { premium: Math.round(userData.autoValue * 0.05) };
}

async function submitClaim(claimData) {
  // const response = await axios.post('/api/claims', claimData);
  return { claimId: "CLM" + Date.now().toString().slice(-6) };
}

async function lookupPolicy(identifier) {
  // const response = await axios.get(`/api/policies/${identifier}`);
  return {
    found: true,
    policy: {
      number: "SKY12345678",
      type: "Health Insurance",
      status: "Active",
    },
  };
}

// ============ WEBHOOK HANDLER (MAIN EXPORT) ============

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return; // FIX: Add return after sending response
  }

  try {
    // Handle GET request for webhook verification
    if (req.method === "GET") {
      const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

      if (!VERIFY_TOKEN) {
        console.error("VERIFY_TOKEN not set in environment variables");
        res.status(500).json({ error: "Server configuration error" });
        return; // FIX: Add return
      }

      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      console.log("Verification attempt:", {
        mode,
        hasToken: !!token,
        hasChallenge: !!challenge,
      });

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verified");
        res.status(200).send(challenge);
        return; // FIX: Add return
      } else {
        console.log("❌ Verification failed");
        res.status(403).send("Forbidden");
        return; // FIX: Add return
      }
    }

    // Handle POST request for incoming messages
    if (req.method === "POST") {
      const body = req.body;

      console.log("📥 Webhook POST received");
      console.log("Body:", JSON.stringify(body, null, 2));

      // Check if this is a message
      if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from;
        const text = message.text?.body;
        const messageType = message.type;

        console.log(`Message: ${messageType} from ${from}`);
        console.log(`Text: "${text}"`);

        // Only reply to text messages
        if (messageType === "text" && text) {
          const API_KEY = process.env.DIALOG_360_API_KEY;
          const isTestMode = !API_KEY || process.env.TEST_MODE === "true";

          // Process message through conversation handler
          const response = handleMessage(from, text);

          if (isTestMode) {
            // Test mode - just log the response
            console.log("🧪 TEST MODE - Would send this reply:");
            console.log(response.message);
            console.log("State:", response.state);
            console.log(
              "✅ Test successful! (No actual WhatsApp message sent)"
            );

            res.status(200).json({
              success: true,
              test_mode: true,
              message_preview: response.message,
              state: response.state,
              note: "This is a test. No actual WhatsApp message was sent.",
            });
            return; // FIX: Add return
          } else {
            // Production mode - send actual WhatsApp message
            if (!API_KEY) {
              console.error("❌ DIALOG_360_API_KEY not set");
              res.status(200).json({
                success: false,
                error: "API key missing",
              });
              return; // FIX: Add return
            }

            console.log("🚀 Attempting to send reply to:", from);
            console.log("🔑 Using API Key:", API_KEY?.substring(0, 10) + "..."); // Debug: Show first 10 chars

            try {
              const whatsappResponse = await axios.post(
                `${BASE_URL}/messages`,
                {
                  messaging_product: "whatsapp",
                  to: from,
                  type: "text",
                  text: { body: response.message },
                },
                {
                  headers: {
                    "D360-API-KEY": API_KEY,
                    "Content-Type": "application/json",
                  },
                }
              );

              console.log("✅ Reply sent successfully!");
              console.log(
                "Message ID:",
                whatsappResponse.data.messages?.[0]?.id
              );
              console.log("Current State:", response.state);

              res.status(200).json({ success: true });
              return; // FIX: Add return
            } catch (whatsappError) {
              console.error(
                "❌ WhatsApp API Error:",
                whatsappError.response?.status
              );
              console.error("Error details:", whatsappError.response?.data);

              // Still return 200 to prevent 360dialog retries
              res.status(200).json({
                success: false,
                error: "WhatsApp API error",
                details: whatsappError.response?.data,
              });
              return; // FIX: Add return
            }
          }
        } else {
          console.log("⚠️ Not a text message or empty text, skipping reply");
        }
      } else {
        console.log("⚠️ No message found in webhook payload");
      }

      res.status(200).json({ success: true });
      return; // FIX: Add return
    }

    res.status(405).json({ error: "Method not allowed" });
    return; // FIX: Add return
  } catch (error) {
    console.error("❌ Error in webhook:", error.message);
    console.error("Stack:", error.stack);

    // Return 200 to prevent retries from 360dialog
    res.status(200).json({
      success: false,
      error: error.message,
    });
    return; // FIX: Add return
  }
}

// Clean up old sessions periodically (run this in a separate cron job)
export function cleanupSessions() {
  const now = Date.now();
  for (const [userId, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      sessions.delete(userId);
      console.log(`Cleaned up session for user: ${userId}`);
    }
  }
}
