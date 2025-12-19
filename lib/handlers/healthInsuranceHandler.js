import { STATES } from "../config/constants.js";
import { SessionManager } from "../session/sessionManager.js";
import { Validators } from "../utils/validationUtils.js";
import { MessageTemplates } from "../utils/messageUtils.js";
import { KampeAPIService } from "../services/kampeApiService.js";
import { LoadingWrapper } from "../utils/loadingWrapper.js";
import { PaymentHandler } from "./paymentHandler.js";

const kampeAPI = new KampeAPIService(process.env.KAMPE_BEARER_TOKEN);

export class HealthInsuranceHandler {
  // ============================================
  // STEP 1: PROVIDER SELECTION
  // ============================================



  static async handleProviderSelection(userId, input, text) {
    const session = SessionManager.getSession(userId);
    const lgaProviders = session.data.lgaProviders || [];
    const otherProviders = session.data.otherProviders || [];
    const availableProviders = session.data.availableProviders || [];
    const showingLgaProviders = session.data.showingLgaProviders;
    const allOtherProviders = session.data.allOtherProviders || [];

    // Handle "ALL" command
    if (input === "all") {
      return this.showProviderList(userId, allOtherProviders);
    }

    // Handle search by name
    if (isNaN(parseInt(input))) {
      const allProviders = [
        ...lgaProviders,
        ...otherProviders,
        ...allOtherProviders,
      ];
      const searchResults = allProviders.filter((provider) =>
        provider.agency_name.toLowerCase().includes(text.toLowerCase())
      );

      if (searchResults.length === 0) {
        return {
          message: `No providers found matching "${text}".\n\nTry a different search term or select from the list above.`,
          state: STATES.HEALTH_PROVIDER_SELECT,
        };
      }

      return this.showProviderList(userId, searchResults);
    }

    // Handle number selection
    const providerNumber = parseInt(input);

    if (showingLgaProviders) {
      // LGA providers mode
      if (providerNumber >= 1 && providerNumber <= lgaProviders.length) {
        const selectedProvider = lgaProviders[providerNumber - 1];
        return this.selectProvider(userId, selectedProvider);
      }

      // "See other providers" option
      if (
        providerNumber === lgaProviders.length + 1 &&
        otherProviders.length > 0
      ) {
        return this.showProviderList(userId, otherProviders.slice(0, 10));
      }
    } else {
      // Other providers mode
      if (providerNumber >= 1 && providerNumber <= availableProviders.length) {
        const selectedProvider = availableProviders[providerNumber - 1];
        return this.selectProvider(userId, selectedProvider);
      }
    }

    const maxNumber = showingLgaProviders
      ? lgaProviders.length + (otherProviders.length > 0 ? 1 : 0)
      : availableProviders.length;

    return {
      message: `Please select a valid number (1-${maxNumber}) or search by provider name.`,
      state: STATES.HEALTH_PROVIDER_SELECT,
    };
  }

  static selectProvider(userId, selectedProvider) {
    SessionManager.updateSession(userId, STATES.HEALTH_REVIEW, {
      selectedProvider: selectedProvider,
      providerId: selectedProvider.id,
      providerName: selectedProvider.agency_name.trim(),
    });

    return this.showReviewSummary(userId);
  }

  static showProviderList(userId, providers) {
    let message = `🏥 *Healthcare Providers*\n\n`;

    providers.forEach((provider, index) => {
      const providerName = provider.agency_name.trim();
      const location = provider.localgovt?.local_name
        ? ` (${provider.localgovt.local_name})`
        : "";
      message += `${index + 1}️⃣ ${providerName}${location}\n`;
    });

    message += `\n_Reply with a number (1-${providers.length}) to select a provider._`;
    message += `\n_Or search again by typing a provider name._`;

    SessionManager.updateSession(userId, STATES.HEALTH_PROVIDER_SELECT, {
      availableProviders: providers,
      showingSearch: false,
    });

    return {
      message,
      state: STATES.HEALTH_PROVIDER_SELECT,
    };
  }

  // ============================================
  // STEP 2: DISPLAY HEALTH PLANS
  // ============================================

  static async showPlans(userId) {
    return LoadingWrapper.callWithLoading(userId, "Loading insurance plans...", async () => {
      try {
        const plansResult = await kampeAPI.getHealthPlans();

        if (plansResult.data.message != "success" || !plansResult.data) {
          return {
            message: `Sorry, we're having trouble loading our health insurance plans. Please try again later or type MENU to return.`,
            state: STATES.MAIN_MENU,
          };
        }

        // Parse plans 
        let plansArray = [];
        if (Array.isArray(plansResult.data)) {
          plansArray = plansResult.data;
        } else if (plansResult.data.plans) {
          plansArray = plansResult.data.plans;
        } else if (plansResult.data.data) {
          plansArray = plansResult.data.data;
        }

        if (plansArray.length === 0) {
          return {
            message: `No health insurance plans are currently available. Please try again later.`,
            state: STATES.MAIN_MENU,
          };
        }

        let message = `🏥 *Health Insurance Plans*\n\n`;
        message += `Choose from our available plans:\n\n`;

        plansArray.forEach((plan, index) => {
          const planName = plan.title;
          const premium = plan.cost;
          const coverage = plan.description;

          message += `*${index + 1}️⃣ ${planName}*\n`;
          message += `Premium: ₦${Validators.formatAmount(premium)}/month\n`;
          message += `Coverage: ${coverage}\n`;
          message += `Type ${index + 1}D to view detailed description\n\n`;
        });

        message += `\n_Reply with a number (1-${plansArray.length}) to select a plan._`;
        message += `\n_Or reply with the number + 'D' (e.g., 1D) to view details._`;

        SessionManager.updateSession(userId, STATES.HEALTH_PLANS_LIST, {
          availablePlans: plansArray,
        });

        return {
          message,
          state: STATES.HEALTH_PLANS_LIST,
        };
      } catch (error) {
        console.error("Error fetching plans:", error);
        return {
          message: `An error occurred while loading plans. Please try again or type MENU.`,
          state: STATES.MAIN_MENU,
        };
      }
    });
  }

  static async handlePlanSelection(userId, input, text) {
    const session = SessionManager.getSession(userId);
    const plans = session.data.availablePlans || [];

    // Check if user wants to view details (e.g., "1D")
    if (input.includes("d") || input.includes("detail")) {
      const planNumber = parseInt(input.replace(/d|detail/gi, "").trim());

      if (planNumber >= 1 && planNumber <= plans.length) {
        const selectedPlan = plans[planNumber - 1];

        let message = `📋 *${selectedPlan.name || selectedPlan.plan_name}*\n\n`;
        message += `*Premium:* ₦${Validators.formatAmount(
          selectedPlan.premium || selectedPlan.price
        )}/month\n\n`;
        message += `*Detailed Coverage:*\n`;
        message += `${
          selectedPlan.full_description ||
          selectedPlan.detailed_coverage ||
          selectedPlan.description
        }\n\n`;
        message += `*Benefits Include:*\n`;

        // Parse benefits if available
        const benefits = selectedPlan.benefits || [];
        if (Array.isArray(benefits) && benefits.length > 0) {
          benefits.forEach((benefit) => {
            message += `• ${benefit}\n`;
          });
        } else {
          message += `• Hospital bills coverage\n`;
          message += `• Outpatient services\n`;
          message += `• Prescription medications\n`;
          message += `• Diagnostic tests\n`;
        }

        message += `\n*Exclusions:*\n`;
        const exclusions = selectedPlan.exclusions || [];
        if (Array.isArray(exclusions) && exclusions.length > 0) {
          exclusions.forEach((exclusion) => {
            message += `• ${exclusion}\n`;
          });
        }

        message += `\n\nType ${planNumber} to select this plan, or type BACK to see all plans.`;

        return {
          message,
          state: STATES.HEALTH_PLAN_DETAILS,
        };
      }
    }

    // Regular plan selection
    const planNumber = parseInt(input);

    if (planNumber >= 1 && planNumber <= plans.length) {
      const selectedPlan = plans[planNumber - 1];

      SessionManager.updateSession(userId, STATES.HEALTH_REG_SURNAME, {
        selectedPlan: selectedPlan,
        planId: selectedPlan.id || selectedPlan.plan_id,
        planName: selectedPlan.name || selectedPlan.plan_name,
        planPremium: selectedPlan.cost || selectedPlan.premium || selectedPlan.price,
      });

      let message = `✅ You've selected: *${selectedPlan.title}*\n\n`;
      message += `📋 *Let's get your details for enrollment.*\n\n`;
      message += `*Step 1: Personal Information*\n\n`;
      message += `What is your *Surname* (Last Name)?`;

      return {
        message,
        state: STATES.HEALTH_REG_SURNAME,
      };
    }

    return {
      message: `Please select a valid plan number (1-${plans.length}), or type a number + 'D' to view details (e.g., 1D).`,
      state: STATES.HEALTH_PLANS_LIST,
    };
  }

  // ============================================
  // STEP 2: PERSONAL INFORMATION
  // ============================================

  static handleSurname(userId, input, text) {
    SessionManager.updateSession(userId, STATES.HEALTH_REG_MIDDLENAME, {
      surname: text,
    });

    return {
      message: `What is your *Middle Name*?\n\n_Type "SKIP" if you don't have a middle name._`,
      state: STATES.HEALTH_REG_MIDDLENAME,
    };
  }

  static handleMiddleName(userId, input, text) {
    const middleName = input === "skip" ? "" : text;

    SessionManager.updateSession(userId, STATES.HEALTH_REG_FIRSTNAME, {
      middlename: middleName,
    });

    return {
      message: `What is your *First Name*?`,
      state: STATES.HEALTH_REG_FIRSTNAME,
    };
  }

  static handleFirstName(userId, input, text) {
    SessionManager.updateSession(userId, STATES.HEALTH_REG_PHONE, {
      firstname: text,
    });

    return {
      message: `What is your *Phone Number*?\n\n_Please enter your 11-digit Nigerian phone number_\n_Example: 08012345678_`,
      state: STATES.HEALTH_REG_PHONE,
    };
  }

  static handlePhone(userId, input, text) {
    // Remove spaces and validate Nigerian phone
    const phone = text.replace(/\s/g, "");
    const phoneRegex = /^0[789][01]\d{8}$/;

    if (!phoneRegex.test(phone)) {
      return {
        message: `Please enter a valid 11-digit Nigerian phone number.\n\n_Example: 08012345678_`,
        state: STATES.HEALTH_REG_PHONE,
      };
    }

    SessionManager.updateSession(userId, STATES.HEALTH_REG_MARITAL, {
      phone: phone,
    });

    return {
      message: `*Step 2: Demographics*\n\nWhat is your *Marital Status*?\n\n1️⃣ Single\n2️⃣ Married\n3️⃣ Widowed\n4️⃣ Separated\n5️⃣ Divorced`,
      state: STATES.HEALTH_REG_MARITAL,
    };
  }

  // ============================================
  // STEP 3: DEMOGRAPHICS
  // ============================================

  static handleMaritalStatus(userId, input, text) {
    const statuses = {
      1: "single",
      2: "married",
      3: "widowed",
      4: "separated",
      5: "divorced",
    };

    const maritalStatus = statuses[input];

    if (!maritalStatus) {
      return {
        message: `Please select a valid option (1-5).`,
        state: STATES.HEALTH_REG_MARITAL,
      };
    }

    SessionManager.updateSession(userId, STATES.HEALTH_REG_STATE, {
      marital_status: maritalStatus,
    });

    // Fetch states
    return this.fetchAndShowStates(userId);
  }

  // ============================================
  // STEP 4: LOCATION DETAILS
  // ============================================

  static async fetchAndShowStates(userId) {
    try {
      const statesResult = await kampeAPI.getStates();

      if (!statesResult.success || !statesResult.data) {
        return {
          message: `*Step 3: Location Details*\n\nWhat *State* do you live in?\n\n_Please type your state name (e.g., Lagos)_`,
          state: STATES.HEALTH_REG_STATE,
        };
      }

      let statesArray = [];
      if (Array.isArray(statesResult.data)) {
        statesArray = statesResult.data;
      } else if (statesResult.data.states) {
        statesArray = statesResult.data.states;
      } else if (statesResult.data.data) {
        statesArray = statesResult.data.data;
      }

      let message = `*Step 3: Location Details*\n\nWhat *State* do you live in?\n\n`;

      statesArray.slice(0, 15).forEach((state, index) => {
        const stateName = state.name;
        message += `${index + 1}️⃣ ${stateName}\n`;
      });

      message += `\n_Reply with number or type state name._`;

      SessionManager.updateSession(userId, STATES.HEALTH_REG_STATE, {
        availableStates: statesArray,
      });

      return {
        message,
        state: STATES.HEALTH_REG_STATE,
      };
    } catch (error) {
      console.error("Error fetching states:", error);
      return {
        message: `*Step 3: Location Details*\n\nWhat *State* do you live in?\n\n_Please type your state name_`,
        state: STATES.HEALTH_REG_STATE,
      };
    }
  }

  static async handleState(userId, input, text) {
    const session = SessionManager.getSession(userId);
    let availableStates = session.data.availableStates;

    if (!Array.isArray(availableStates)) {
      availableStates = [];
    }

    let selectedState = null;
    let stateId = null;

    const inputNumber = parseInt(input);
    if (
      !isNaN(inputNumber) &&
      inputNumber > 0 &&
      inputNumber <= availableStates.length
    ) {
      selectedState = availableStates[inputNumber - 1];
      stateId = selectedState.id || selectedState.state_id;
    } else if (availableStates.length > 0) {
      selectedState = availableStates.find(
        (state) =>
          (state.name || state.state_name)?.toLowerCase() === text.toLowerCase()
      );
      stateId = selectedState?.id || selectedState?.state_id;
    }

    if (!selectedState && availableStates.length > 0) {
      return {
        message: `State not found. Please select from the list or type the exact name.`,
        state: STATES.HEALTH_REG_STATE,
      };
    }

    const stateName = selectedState
      ? selectedState.name || selectedState.state_name
      : text;

    SessionManager.updateSession(userId, STATES.HEALTH_REG_LGA, {
      state: stateName,
      stateId: stateId,
    });

    // Fetch LGAs for selected state
    if (stateId) {
      return this.fetchAndShowLGAs(userId, stateId);
    } else {
      return {
        message: `What is your *Local Government Area (LGA)*?\n\n_Please type your LGA name_`,
        state: STATES.HEALTH_REG_LGA,
      };
    }
  }

  static async fetchAndShowLGAs(userId, stateId) {
    try {
      const lgasResult = await kampeAPI.getLGAs(stateId);

      if (!lgasResult.success || !lgasResult.data) {
        return {
          message: `What is your *Local Government Area (LGA)*?\n\n_Please type your LGA name_`,
          state: STATES.HEALTH_REG_LGA,
        };
      }

      let lgasArray = [];
      if (Array.isArray(lgasResult.data)) {
        lgasArray = lgasResult.data;
      } else if (lgasResult.data.lgas) {
        lgasArray = lgasResult.data.lgas;
      } else if (lgasResult.data.data) {
        lgasArray = lgasResult.data.data;
      }

      let message = `Select your *Local Government Area (LGA)*:\n\n`;

      lgasArray.slice(0, 20).forEach((lga, index) => {
        const lgaName = lga.local_name || lga.lga_name || "Unnamed LGA";
        message += `${index + 1}️⃣ ${lgaName}\n`;
      });



      message += `\n_Reply with number or type LGA name._`;

      SessionManager.updateSession(userId, STATES.HEALTH_REG_LGA, {
        availableLGAs: lgasArray,
      });

      return {
        message,
        state: STATES.HEALTH_REG_LGA,
      };
    } catch (error) {
      console.error("Error fetching LGAs:", error);
      return {
        message: `What is your *Local Government Area (LGA)*?\n\n_Please type your LGA name_`,
        state: STATES.HEALTH_REG_LGA,
      };
    }
  }

  static async handleLGA(userId, input, text) {
    const session = SessionManager.getSession(userId);
    let availableLGAs = session.data.availableLGAs;

    if (!Array.isArray(availableLGAs)) {
      availableLGAs = [];
    }

    let selectedLGA = null;
    let lgaId = null;

    const inputNumber = parseInt(input);
    if (
      !isNaN(inputNumber) &&
      inputNumber > 0 &&
      inputNumber <= availableLGAs.length
    ) {
      selectedLGA = availableLGAs[inputNumber - 1];
      lgaId = selectedLGA.id || selectedLGA.lga_id;
    } else if (availableLGAs.length > 0) {
      selectedLGA = availableLGAs.find(
        (lga) =>
          (lga.name || lga.lga_name)?.toLowerCase() === text.toLowerCase()
      );
      lgaId = selectedLGA?.id || selectedLGA?.lga_id;
    }

    const lgaName = selectedLGA
      ? selectedLGA.local_name || selectedLGA.lga_name || selectedLGA.name
      : text;

    SessionManager.updateSession(userId, STATES.HEALTH_REG_ADDRESS, {
      lga: lgaName,
      lgaId: lgaId,
    });

    return {
      message: `*Step 4: Address Information*\n\nWhat is your *Home Address*?\n\n_Please provide your full residential address._`,
      state: STATES.HEALTH_REG_ADDRESS,
    };
  }

  static async handleAddress(userId, input, text) {
    if (text.length < 10) {
      return {
        message: `Please provide a complete address (at least 10 characters).`,
        state: STATES.HEALTH_REG_ADDRESS,
      };
    }

    SessionManager.updateSession(userId, STATES.HEALTH_PROVIDER_SELECT, {
      address: text,
    });

    return LoadingWrapper.callWithLoading(userId, "Loading healthcare providers...", async () => {
      const session = SessionManager.getSession(userId);
      const userLgaId = session.data.lgaId;
      
      const providersResult = await kampeAPI.getProviders();

      if (!providersResult.success || !providersResult.data) {
        return {
          message: `Sorry, we're having trouble loading providers. Please try again later or type MENU to return.`,
          state: STATES.MAIN_MENU,
        };
      }

      let providersArray = [];
      if (Array.isArray(providersResult.data)) {
        providersArray = providersResult.data;
      } else if (providersResult.data.providers) {
        providersArray = providersResult.data.providers;
      } else if (providersResult.data.data) {
        providersArray = providersResult.data.data;
      }

      // Filter providers with valid agency names
      const validProviders = providersArray.filter((provider) => {
        const name = (provider.agency_name || "").trim();
        return name && name.length > 2;
      });

      // Filter by user's LGA first
      const lgaProviders = validProviders.filter(
        (provider) => provider.localgovt?.id == userLgaId
      );

      // Other providers as backup
      const otherProviders = validProviders.filter(
        (provider) => provider.localgovt?.id != userLgaId
      );

      let message = `🏥 *Select Your Healthcare Provider*\n\n`;

      if (lgaProviders.length > 0) {
        message += `*Providers in your area (${
          session.data.lga || "your location"
        }):*\n\n`;

        lgaProviders.forEach((provider, index) => {
          const providerName = provider.agency_name.trim();
          message += `${index + 1}️⃣ ${providerName}\n`;
        });

        if (otherProviders.length > 0) {
          message += `\n*Other providers:*\n`;
          message += `${lgaProviders.length + 1}️⃣ See all other providers\n`;
        }

        message += `\n_Reply with a number to select a provider._`;
        message += `\n_Or type provider name to search._`;

        SessionManager.updateSession(userId, STATES.HEALTH_PROVIDER_SELECT, {
          lgaProviders: lgaProviders,
          otherProviders: otherProviders,
          showingLgaProviders: true,
        });
      } else {
        message += `No providers found in your area (${
          session.data.lga || "your location"
        }).\n\n`;
        message += `*Available providers in other areas:*\n\n`;

        const displayProviders = otherProviders.slice(0, 10);
        displayProviders.forEach((provider, index) => {
          const providerName = provider.agency_name.trim();
          const location = provider.localgovt?.local_name
            ? ` (${provider.localgovt.local_name})`
            : "";
          message += `${index + 1}️⃣ ${providerName}${location}\n`;
        });

        if (otherProviders.length > 10) {
          message += `\n_Showing first 10. Type "ALL" to see all providers._`;
        }

        message += `\n_Reply with a number to select a provider._`;

        SessionManager.updateSession(userId, STATES.HEALTH_PROVIDER_SELECT, {
          availableProviders: displayProviders,
          allOtherProviders: otherProviders,
          showingLgaProviders: false,
        });
      }

      return {
        message,
        state: STATES.HEALTH_PROVIDER_SELECT,
      };
    });
  }

  // ============================================
  // STEP 5: REVIEW & CONFIRMATION
  // ============================================

  static showReviewSummary(userId) {
    const session = SessionManager.getSession(userId);
    const data = session.data;

    let message = `📋 *Please Review Your Details*\n\n`;
    message += `*Provider:*\n`;
    message += `${data.providerName}\n\n`;

    message += `*Personal Information:*\n`;
    message += `Full Name: ${data.surname} ${data.middlename} ${data.firstname}\n`;
    message += `Phone: ${data.phone}\n\n`;

    message += `*Demographics:*\n`;
    message += `Marital Status: ${data.marital_status}\n\n`;

    message += `*Location:*\n`;
    message += `State: ${data.state}\n`;
    message += `LGA: ${data.lga}\n`;
    message += `Home Address: ${data.address}\n\n`;

    message += `*Please choose:*\n\n`;
    message += `1️⃣ Confirm & Proceed to Registration\n`;
    message += `2️⃣ Edit Information\n`;
    message += `3️⃣ Cancel Registration`;

    return {
      message,
      state: STATES.HEALTH_REVIEW,
    };
  }

  static handleReview(userId, input, text) {
    if (input === "1" || input.includes("confirm")) {
      return this.processEnrollment(userId);
    }

    if (input === "2" || input.includes("edit")) {
      SessionManager.updateSession(userId, STATES.HEALTH_REVIEW_EDIT);

      return {
        message: `What would you like to edit?\n\n1️⃣ Personal Information\n2️⃣ Marital Status\n3️⃣ Location\n4️⃣ Home Address\n5️⃣ Cancel Edit`,
        state: STATES.HEALTH_REVIEW_EDIT,
      };
    }

    if (input === "3" || input.includes("cancel")) {
      SessionManager.clearSession(userId);
      return {
        message: `Enrollment cancelled. Type MENU to return to main menu.`,
        state: STATES.MAIN_MENU,
      };
    }

    return {
      message: `Please select 1, 2, or 3.`,
      state: STATES.HEALTH_REVIEW,
    };
  }

  static handleReviewEdit(userId, input, text) {
    const editOptions = {
      1: STATES.HEALTH_REG_SURNAME,
      2: STATES.HEALTH_REG_MARITAL,
      3: STATES.HEALTH_REG_STATE,
      4: STATES.HEALTH_REG_ADDRESS,
    };

    const nextState = editOptions[input];

    if (!nextState) {
      if (input === "5" || input.includes("cancel")) {
        return this.showReviewSummary(userId);
      }
      return {
        message: `Please select a valid option (1-5).`,
        state: STATES.HEALTH_REVIEW_EDIT,
      };
    }

    SessionManager.updateSession(userId, nextState);

    const messages = {
      [STATES.HEALTH_REG_SURNAME]: "What is your *Surname* (Last Name)?",
      [STATES.HEALTH_REG_MARITAL]:
        "What is your *Marital Status*?\n\n1️⃣ Single\n2️⃣ Married\n3️⃣ Widowed\n4️⃣ Separated\n5️⃣ Divorced",
      [STATES.HEALTH_REG_STATE]: "What *State* do you live in?",
      [STATES.HEALTH_REG_ADDRESS]: "What is your *Home Address*?",
    };

    return {
      message: messages[nextState],
      state: nextState,
    };
  }

  // ============================================
  // STEP 6: REGISTRATION
  // ============================================

    static async processEnrollment(userId) {

      const session = SessionManager.getSession(userId);

      const data = session.data;

  

      // Set processing state

      SessionManager.updateSession(userId, STATES.HEALTH_PROCESSING);

  

      try {

        const enrollmentData = {

          firstname: data.firstname,

          lastname: data.surname,

          middlename: data.middlename,

          phone_number: data.phone,

          user_image: "default.png",

          provider_id: data.providerId,

          sector: "1",

          state: data.stateId,

          localgovt: data.lgaId,

          marital_status: data.marital_status,

          address: data.address,

        };

  

        // Store Kampe enrollment data in session for later use after payment

        SessionManager.updateSession(userId, STATES.HEALTH_PROCESSING, {

          kampeEnrollmentData: enrollmentData,

          // Also ensure payment-related details are in session for PaymentHandler

          premium: data.planPremium,

          firstName: data.firstname,

          lastName: data.surname,

          email: data.email || "customer@example.com", // Assuming email might be collected earlier or defaults

          phone: data.phone,

          address: data.address,

        });

  

        // Initialize GlobalPay payment directly
        return this.initializeGlobalPayPayment(userId, data.planPremium, data);

  

      } catch (error) {

        console.error("Error preparing for GlobalPay payment:", error);

        return {

          message: `An error occurred while preparing your payment. Please try again later or contact support.`,

          state: STATES.MAIN_MENU,

        };

      }

    }

  static async initializeGlobalPayPayment(userId, premium, data) {
    try {
      const GlobalPayAPIService = (await import('../services/globalPayApiService.js')).GlobalPayAPIService;
      const globalPayService = new GlobalPayAPIService();
      const merchantTransactionReference = `HEALTH_${userId}_${Date.now()}`;

      const paymentDetails = {
        amount: premium,
        currency: "NGN",
        customerFirstName: data.firstname,
        customerLastName: data.surname,
        customerEmail: data.email || `${data.phone}@temp.com`,
        customerPhone: data.phone,
        customerAddress: data.address,
        merchantTransactionReference: merchantTransactionReference,
      };

      const result = await globalPayService.initiatePayment(paymentDetails);

      if (result.success && result.data.checkoutUrl) {
        SessionManager.updateSession(userId, STATES.PAYMENT_CONFIRMATION, {
          merchantTransactionReference,
        });

        let message = `💳 *Complete Your Payment*\n\n`;
        message += `Premium: ₦${Validators.formatAmount(premium)}\n\n`;
        message += `Click the link below to pay:\n${result.data.checkoutUrl}\n\n`;
        message += `After payment, reply "DONE" to activate your policy.`;

        return {
          message,
          state: STATES.PAYMENT_CONFIRMATION,
        };
      } else {
        return {
          message: `Payment initialization failed. Please try again or contact support.`,
          state: STATES.HEALTH_REVIEW,
        };
      }
    } catch (error) {
      console.error('GlobalPay initialization error:', error);
      return {
        message: `Payment system error. Please try again later.`,
        state: STATES.HEALTH_REVIEW,
      };
    }
  }

  // ============================================
  // STEP 7: PAYMENT VERIFICATION
  // ============================================

  static async handlePaymentConfirmation(userId, input, text) {
    if (
      input.includes("done") ||
      input.includes("paid") ||
      input.includes("completed")
    ) {
      return this.verifyGlobalPayPayment(userId);
    }

    if (input.includes("cancel")) {
      SessionManager.updateSession(userId, STATES.HEALTH_REVIEW);
      return {
        message: `Payment cancelled. You can try again from the review page.`,
        state: STATES.HEALTH_REVIEW,
      };
    }

    return {
      message: `Please complete your payment using the link provided, then reply "DONE" to verify.`,
      state: STATES.PAYMENT_CONFIRMATION,
    };
  }

  static async verifyGlobalPayPayment(userId) {
    const session = SessionManager.getSession(userId);
    const merchantTransactionReference = session.data.merchantTransactionReference;

    if (!merchantTransactionReference) {
      return {
        message: `Payment reference not found. Please try the payment process again.`,
        state: STATES.HEALTH_REVIEW,
      };
    }

    try {
      const GlobalPayAPIService = (await import('../services/globalPayApiService.js')).GlobalPayAPIService;
      const globalPayService = new GlobalPayAPIService();
      
      const verificationResult = await globalPayService.verifyPayment(merchantTransactionReference);

      // Check various possible success indicators
      const isSuccessful = verificationResult.success && (
        verificationResult.data.status === 'successful' ||
        verificationResult.data.status === 'success' ||
        verificationResult.data.status === 'completed' ||
        verificationResult.data.paymentStatus === 'successful' ||
        verificationResult.data.paid === true
      );

      if (isSuccessful) {
        // Payment verified, now process Kampe enrollment
        return this.initiateKampeEnrollment(userId);
      } else {
        console.log('Payment verification response:', verificationResult.data);
        return {
          message: `❌ Payment not confirmed yet. Please ensure you've completed payment and try again.\n\nReply "DONE" to check again.`,
          state: STATES.PAYMENT_CONFIRMATION,
        };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        message: `Error verifying payment. Please contact support with reference: ${merchantTransactionReference}`,
        state: STATES.MAIN_MENU,
      };
    }
  }

  static async verifyAndActivatePolicy(userId) {
    const session = SessionManager.getSession(userId);
    const data = session.data;

    try {
      // Verify payment via Kampe API
      const verificationResult = await kampeAPI.verifyPayment(
        data.invoiceNumber
      );

      if (!verificationResult.success || !verificationResult.data.paid) {
        return {
          message: `❌ Payment not confirmed yet. Please ensure you've completed payment and try again in a few minutes.\n\nReply "DONE" to check again.`,
          state: STATES.HEALTH_PAYMENT,
        };
      }

      // Get policy details
      const policyNumber = verificationResult.data.policy_number;
      const policyData = verificationResult.data.policy || {};

      SessionManager.updateSession(userId, STATES.HEALTH_POLICY_ACTIVATED, {
        policyNumber: policyNumber,
        policyData: policyData,
      });

      let message = `🎉 *Congratulations!*\n\n`;
      message += `✅ Your Health Insurance policy has been activated successfully!\n\n`;
      message += `📋 *Policy Details:*\n`;
      message += `Policy Number: *${policyNumber}*\n`;
      message += `Plan: ${data.planName}\n`;
      message += `Premium: ₦${Validators.formatAmount(
        data.planPremium
      )}/month\n`;
      message += `Effective Date: ${new Date().toLocaleDateString()}\n\n`;
      message += `*What's Next?*\n\n`;
      message += `1️⃣ View Policy Benefits\n`;
      message += `2️⃣ Download Policy Certificate\n`;
      message += `3️⃣ Get Support\n`;
      message += `4️⃣ Return to Menu`;

      return {
        message,
        state: STATES.HEALTH_POLICY_ACTIVATED,
      };
    } catch (error) {
      console.error("Payment verification error:", error);
      return {
        message: `Error verifying payment. Please contact support with your invoice number: ${data.invoiceNumber}`,
        state: STATES.MAIN_MENU,
      };
    }
  }


  static async initiateKampeEnrollment(userId) {
    const session = SessionManager.getSession(userId);
    const kampeEnrollmentData = session.data.kampeEnrollmentData;

    if (!kampeEnrollmentData) {
      return {
        message: `Enrollment data not found. Please contact support.`,
        state: STATES.MAIN_MENU,
      };
    }

    try {
      console.log('⏳ Processing Kampe enrollment...');
      const enrollmentResult = await kampeAPI.createEnrollment(kampeEnrollmentData);

      if (enrollmentResult.message === "Successfully created user!") {
        SessionManager.clearSession(userId);

        let message = `✅ *Health Insurance Registration Complete!*\n\n`;
        message += `🎉 Your health insurance policy has been successfully created!\n\n`;
        message += `📋 *Registration Details:*\n`;
        message += `Name: ${kampeEnrollmentData.firstname} ${kampeEnrollmentData.middlename || ""} ${kampeEnrollmentData.lastname}\n`;
        message += `Provider ID: ${kampeEnrollmentData.provider_id}\n`;
        message += `Location: ${session.data.lga}, ${session.data.state}\n\n`;
        message += `You will receive confirmation details shortly.\n\n`;
        message += `Type MENU to return to main menu.`;

        return {
          message,
          state: STATES.MAIN_MENU,
        };
      } else {
        return {
          message: `Registration failed: ${enrollmentResult.message || enrollmentResult.error}\n\nPlease contact support.`,
          state: STATES.MAIN_MENU,
        };
      }
    } catch (error) {
      console.error('Kampe enrollment error:', error);
      return {
        message: `An error occurred during registration. Please contact support.`,
        state: STATES.MAIN_MENU,
      };
    }
  } occurred. Enrollment data was not found. Please start over from the main menu.`,
        state: STATES.MAIN_MENU,
      };
    }

    try {
      const enrollmentResult = await kampeAPI.createEnrollment(kampeEnrollmentData);

      if (!enrollmentResult.success) {
        console.error("Kampe Enrollment API Error:", enrollmentResult.error);
        SessionManager.clearSession(userId); // Clear session on error
        return {
          message: `Sorry, there was an error processing your health insurance enrollment after payment. Please contact support with this reference: ${session.data.merchantTransactionReference || "N/A"}`,
          state: STATES.MAIN_MENU,
        };
      }

      // Enrollment successful
      SessionManager.clearSession(userId); // Clear session completely after successful enrollment

      let message = `✅ *Health Insurance Registration Successful!*\n\n`;
      message += `🎉 Your health insurance policy has been created and will be active shortly!\n\n`;
      message += `📋 *Registration Details:*\n`;
      message += `Name: ${kampeEnrollmentData.firstname} ${kampeEnrollmentData.middlename || ""} ${kampeEnrollmentData.lastname}\n`;
      message += `Provider ID: ${kampeEnrollmentData.provider_id}\n`;
      message += `Location: ${kampeEnrollmentData.localgovt}, ${kampeEnrollmentData.state}\n\n`;
      message += `You will receive an email confirmation with your policy details soon.\n\n`;
      message += `Type MENU to return to main menu.`;

      return {
        message,
        state: STATES.MAIN_MENU,
      };
    } catch (error) {
      console.error("Error during Kampe API enrollment:", error);
      SessionManager.clearSession(userId); // Clear session on unexpected error
      return {
        message: `An unexpected error occurred during your health insurance enrollment. Please contact support.`,
        state: STATES.MAIN_MENU,
      };
    }
  }
}

