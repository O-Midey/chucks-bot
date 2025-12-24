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
  // GLOBAL ERROR RECOVERY
  // ============================================

  static handleGlobalCommands(userId, input, currentState) {
    if (input === "back" || input === "previous") {
      return this.goBackOneStep(userId, currentState);
    }
    return null; // No global command matched
  }

  static goBackOneStep(userId, currentState) {
    const stateFlow = {
      [STATES.HEALTH_PLAN_DETAILS]: STATES.HEALTH_PLANS_LIST,
      [STATES.HEALTH_REG_MIDDLENAME]: STATES.HEALTH_REG_SURNAME,
      [STATES.HEALTH_REG_FIRSTNAME]: STATES.HEALTH_REG_MIDDLENAME,
      [STATES.HEALTH_REG_EMAIL]: STATES.HEALTH_REG_FIRSTNAME,
      [STATES.HEALTH_REG_PHONE]: STATES.HEALTH_REG_EMAIL,
      [STATES.HEALTH_REG_MARITAL]: STATES.HEALTH_REG_PHONE,
      [STATES.HEALTH_REG_STATE]: STATES.HEALTH_REG_MARITAL,
      [STATES.HEALTH_REG_LGA]: STATES.HEALTH_REG_STATE,
      [STATES.HEALTH_REG_ADDRESS]: STATES.HEALTH_REG_LGA,
      [STATES.HEALTH_PROVIDER_SELECT]: STATES.HEALTH_REG_ADDRESS,
      [STATES.HEALTH_REVIEW]: STATES.HEALTH_PROVIDER_SELECT,
    };

    const previousState = stateFlow[currentState];
    if (previousState) {
      SessionManager.updateSession(userId, previousState);
      return this.getPromptForState(previousState);
    }

    return {
      message: `Cannot go back from this step. Type MENU to return to main menu.`,
      state: currentState,
    };
  }

  static getPromptForState(state) {
    const prompts = {
      [STATES.HEALTH_REG_SURNAME]: {
        message: "What is your *Surname* (Last Name)?",
        state,
      },
      [STATES.HEALTH_REG_MIDDLENAME]: {
        message:
          'What is your *Middle Name*?\n\n_Type "SKIP" if you don\'t have a middle name._',
        state,
      },
      [STATES.HEALTH_REG_FIRSTNAME]: {
        message: "What is your *First Name*?",
        state,
      },
      [STATES.HEALTH_REG_EMAIL]: {
        message:
          "What is your *Email Address*?\n\n_Please enter a valid email address_\n_Example: john@example.com_",
        state,
      },
      [STATES.HEALTH_REG_PHONE]: {
        message:
          "What is your *Phone Number*?\n\n_Please enter your 11-digit Nigerian phone number_\n_Example: 08012345678_",
        state,
      },
      [STATES.HEALTH_REG_MARITAL]: {
        message:
          "What is your *Marital Status*?\n\n1️⃣ Single\n2️⃣ Married\n3️⃣ Widowed\n4️⃣ Separated\n5️⃣ Divorced",
        state,
      },
    };
    return (
      prompts[state] || {
        message: "Please continue with your registration.",
        state,
      }
    );
  }
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

    // Handle "CHANGE LGA" command
    if (
      input === "change lga" ||
      input === "change" ||
      input === "lga"
    ) {
      SessionManager.updateSession(userId, STATES.HEALTH_REG_LGA);
      return {
        message: `Going back to select a different Local Government Area...`,
        state: STATES.HEALTH_REG_LGA,
      };
    }

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
          message: `No healthcare providers found matching "${text}".\n\n🏥 *Please select a healthcare provider from the numbered list above.*\n\nYou can:\n• Reply with a number (e.g., 1, 2, 3)\n• Type a provider name to search\n• Type "CHANGE LGA" to select a different area\n• Type "ALL" to see all providers`,
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
    message += `\n_Type "CHANGE LGA" to select a different area._`;
    message += `\n_Or search by typing a provider name (e.g., "General Hospital")._`;
    message += `\n\n📝 *Please select a healthcare provider, not your address.*`;

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

  static getHealthPlans() {
    return [
      // Basic Plans (Monthly)
      {
        id: 1,
        title: "Chuks Basic",
        cost: 5000,
        period: "month",
        currency: "NGN",
        description:
          "Essential healthcare services including outpatient care, inpatient services (up to 18 days/year), diagnostics, minor surgeries (up to ₦60,000), emergency care, telemedicine, and wellness checks. Annual medical limit: ₦200,000",
        annualLimit: "₦200,000",
        detailedCoverage: [
          "*Outpatient Services:* General and specialist consultations, prescribed drugs, laboratory tests, X-rays",
          "*Inpatient Services:* General ward admission (up to 18 days/year), feeding up to ₦1,500/day",
          "*Dental Services:* Pain management, simple tooth extraction (up to 2 teeth/year)",
          "*Optical Services:* Conjunctivitis treatment, foreign body removal, specialist consultation",
          "*Surgeries:* Minor/intermediate (up to ₦60,000), Major (up to ₦100,000)",
          "*Emergency Care:* Stabilization, evacuation, trauma management (up to ₦60,000/year)",
          "*Mental Health:* Psychiatric consultation and treatment (up to 8 weeks)",
          "*Telemedicine:* Teleconsultation and telepharmacy services",
          "*Wellness Checks:* Blood pressure, BMI, eye screening, weight, height",
        ],
      },
      {
        id: 2,
        title: "Chuks Plus",
        cost: 7000,
        period: "month",
        currency: "NGN",
        description:
          "Comprehensive plan covering primary, secondary, and tertiary healthcare services. Includes specialist consultations, childhood immunizations, advanced diagnostics, and hospital admissions. Annual medical limit: ₦400,000",
        annualLimit: "₦400,000",
        detailedCoverage: [
          "*Primary Healthcare:* Outpatient consultations, routine lab tests, childhood immunizations",
          "*Treatment Coverage:* Malaria, infections, diarrhea, pneumonia, anemia",
          "*Surgical Procedures:* Minor surgical procedures and wound care",
          "*Specialized Care:* HIV/AIDS counseling, mental health care, pediatric care",
          "*Maternity Care:* Routine obstetrics and gynecology services",
          "*Secondary Healthcare:* Hospital admissions, specialist referrals, physiotherapy",
          "*Tertiary Healthcare:* Advanced medical and surgical services",
          "*Dental Services:* Scaling, polishing, and comprehensive dental care",
        ],
      },
      {
        id: 3,
        title: "Chuks Senior Basic",
        cost: 35000,
        period: "month",
        currency: "NGN",
        description:
          "Specialized geriatric care for ages 60-89. Covers pre-existing conditions (arthritis, hypertension, diabetes), preventive wellness checks, eye glasses provision, dental care, physiotherapy, and chronic illness support",
        detailedCoverage: [
          "*Pre-existing Conditions:* Arthritis, hypertension, diabetes management and treatment",
          "*Geriatric Care:* Specialized elderly healthcare services and consultations",
          "*Preventive Care:* Regular wellness checks, health screenings, and monitoring",
          "*Vision Care:* Eye glasses provision and optical services",
          "*Dental Services:* Comprehensive dental care and treatments",
          "*Physiotherapy:* Rehabilitation and physical therapy sessions",
          "*Chronic Illness Support:* Ongoing management and medication coverage",
          "*Emergency Services:* 24/7 emergency medical care and stabilization",
        ],
      },
      {
        id: 4,
        title: "Chuks Senior Plus",
        cost: 47000,
        period: "month",
        currency: "NGN",
        description:
          "Premium senior coverage with comprehensive geriatric care, advanced investigations (CT/MRI), intensive care services, 3 square meals, and extensive chronic illness management for ages 60-89",
        detailedCoverage: [
          "*Advanced Diagnostics:* CT scans, MRI, and comprehensive medical investigations",
          "*Intensive Care:* ICU services and critical care management",
          "*Meal Services:* 3 square meals daily during hospital stays",
          "*Comprehensive Geriatric Care:* Specialized elderly medical services",
          "*Chronic Disease Management:* Extensive support for long-term conditions",
          "*Specialist Consultations:* Access to geriatricians and specialists",
          "*Emergency Care:* Priority emergency services and ambulance coverage",
          "*Rehabilitation Services:* Physical therapy and recovery programs",
        ],
      },

      // Diaspora Plans (USD)
      {
        id: 5,
        title: "Chuks Basic Diaspora",
        cost: 62,
        period: "year",
        currency: "USD",
        description:
          "Comprehensive coverage for diaspora including inpatient, outpatient, dental, optical, emergency care, surgeries, rehabilitative services, HIV/AIDS support, and wellness checks",
        detailedCoverage: [
          "*Inpatient Services:* Hospital admissions and ward accommodations",
          "*Outpatient Care:* General and specialist consultations",
          "*Dental Services:* Routine dental care and treatments",
          "*Optical Services:* Eye care and vision correction",
          "*Emergency Care:* 24/7 emergency medical services",
          "*Surgical Procedures:* Minor and intermediate surgeries",
          "*Rehabilitative Services:* Physical therapy and recovery programs",
          "*HIV/AIDS Support:* Counseling and treatment services",
          "*Wellness Checks:* Preventive health screenings and monitoring",
        ],
      },
      {
        id: 6,
        title: "Chuks Plus Diaspora",
        cost: 78,
        period: "year",
        currency: "USD",
        description:
          "Enhanced diaspora plan with primary, secondary, and tertiary care coverage. Includes maternity care, immunizations, specialist services, and telemedicine. Annual limit: ₦500,000",
        annualLimit: "₦500,000",
        detailedCoverage: [
          "*Primary Healthcare:* Basic medical consultations and treatments",
          "*Secondary Healthcare:* Specialist referrals and hospital services",
          "*Tertiary Healthcare:* Advanced medical and surgical procedures",
          "*Maternity Care:* Prenatal, delivery, and postnatal services",
          "*Immunizations:* Childhood and adult vaccination programs",
          "*Specialist Services:* Access to medical specialists and consultants",
          "*Telemedicine:* Remote consultations and digital health services",
          "*Diagnostic Services:* Laboratory tests and medical imaging",
        ],
      },
      {
        id: 7,
        title: "Chuks Superior Diaspora",
        cost: 92,
        period: "year",
        currency: "USD",
        description:
          "Comprehensive diaspora package with chronic disease management, maternity care, cancer care (up to ₦300,000), fertility services, advanced diagnostics, and wellness services. Annual limit: ₦1,000,000",
        annualLimit: "₦1,000,000",
        detailedCoverage: [
          "*Chronic Disease Management:* Long-term condition monitoring and treatment",
          "*Maternity Care:* Complete pregnancy and childbirth coverage",
          "*Cancer Care:* Oncology treatments up to ₦300,000",
          "*Fertility Services:* Reproductive health and fertility treatments",
          "*Advanced Diagnostics:* CT scans, MRI, and specialized tests",
          "*Wellness Services:* Preventive care and health promotion programs",
          "*Specialist Care:* Access to medical specialists and consultants",
          "*Emergency Services:* Comprehensive emergency medical coverage",
        ],
      },
      {
        id: 8,
        title: "Chuks Senior Diaspora",
        cost: 300,
        period: "year",
        currency: "USD",
        description:
          "Specialized senior diaspora care with comprehensive chronic condition management, surgery coverage (up to ₦500,000), dialysis sessions, and extensive wellness services. Annual limit: ₦2,500,000",
        annualLimit: "₦2,500,000",
        detailedCoverage: [
          "*Chronic Condition Management:* Comprehensive care for long-term illnesses",
          "*Surgery Coverage:* Surgical procedures up to ₦500,000",
          "*Dialysis Sessions:* Kidney dialysis treatments and support",
          "*Geriatric Care:* Specialized elderly healthcare services",
          "*Wellness Services:* Extensive preventive care and health monitoring",
          "*Emergency Care:* Priority emergency medical services",
          "*Specialist Consultations:* Access to geriatricians and specialists",
          "*Rehabilitation Services:* Physical therapy and recovery programs",
        ],
      },
      {
        id: 9,
        title: "Chuks Ruby",
        cost: 400,
        period: "year",
        currency: "USD",
        description:
          "Extensive diaspora coverage with maternity care, cancer treatment (up to ₦300,000), 15 physiotherapy sessions, comprehensive dental care, eye surgery, and behavioral health support. Annual limit: ₦4,000,000",
        annualLimit: "₦4,000,000",
        detailedCoverage: [
          "*Maternity Care:* Complete pregnancy, delivery, and postnatal services",
          "*Cancer Treatment:* Oncology care and treatments up to ₦300,000",
          "*Physiotherapy:* 15 sessions of physical therapy and rehabilitation",
          "*Comprehensive Dental Care:* Full dental treatments and procedures",
          "*Eye Surgery:* Optical surgical procedures and treatments",
          "*Behavioral Health Support:* Mental health counseling and therapy",
          "*Emergency Services:* 24/7 emergency medical care",
          "*Specialist Care:* Access to medical specialists and consultants",
        ],
      },
      {
        id: 10,
        title: "Chuks Gold",
        cost: 565,
        period: "year",
        currency: "USD",
        description:
          "Enhanced diaspora plan with all surgeries including laparoscopic (up to ₦1,000,000), cancer care, fertility investigations, extensive dental coverage, gym access (7 sessions/month), and spa services",
        detailedCoverage: [
          "*All Surgeries:* Including laparoscopic procedures up to ₦1,000,000",
          "*Cancer Care:* Comprehensive oncology treatments and support",
          "*Fertility Investigations:* Reproductive health assessments and treatments",
          "*Extensive Dental Coverage:* Complete dental care and procedures",
          "*Gym Access:* 7 fitness sessions per month for wellness",
          "*Spa Services:* Wellness and relaxation therapy sessions",
          "*Advanced Diagnostics:* Comprehensive medical imaging and tests",
          "*Specialist Care:* Premium access to medical specialists",
        ],
      },
      {
        id: 11,
        title: "Chuks Diamond",
        cost: 825,
        period: "year",
        currency: "USD",
        description:
          "Most comprehensive diaspora plan with global treatment coverage, advanced diagnostics (CT/MRI), extensive specialist services, cancer therapy, dialysis, telemedicine, and mental health support. Annual limit: ₦7,000,000",
        annualLimit: "₦7,000,000",
        detailedCoverage: [
          "*Global Treatment Coverage:* Worldwide medical care and services",
          "*Advanced Diagnostics:* CT scans, MRI, and specialized imaging",
          "*Extensive Specialist Services:* Premium access to all medical specialists",
          "*Cancer Therapy:* Comprehensive oncology treatments and care",
          "*Dialysis Services:* Kidney dialysis treatments and support",
          "*Telemedicine:* Remote consultations and digital health services",
          "*Mental Health Support:* Psychiatric care and counseling services",
          "*Emergency Care:* Priority global emergency medical services",
        ],
      },
      {
        id: 12,
        title: "Chuks Travel Plan",
        cost: 425,
        period: "year",
        currency: "USD",
        description:
          "Short-term emergency travel insurance for diaspora travelers. Covers urgent healthcare needs, outpatient/inpatient care, maternity, chronic disease support, and emergency services for 4-6 weeks",
        detailedCoverage: [
          "*Emergency Healthcare:* Urgent medical care during travel (4-6 weeks)",
          "*Outpatient Care:* Medical consultations and treatments",
          "*Inpatient Services:* Hospital admissions and care",
          "*Maternity Coverage:* Emergency pregnancy and childbirth care",
          "*Chronic Disease Support:* Ongoing condition management during travel",
          "*Emergency Services:* 24/7 emergency medical assistance",
          "*Medical Evacuation:* Emergency transportation to medical facilities",
          "*Travel Health Support:* Health assistance and guidance while traveling",
        ],
      },

      // HDPTC Plans (Naira)
      {
        id: 13,
        title: "Chuks Basic HDPTC",
        cost: 46600,
        period: "year",
        currency: "NGN",
        description:
          "High Deductible Plan with tax benefits, Health Savings Account options, essential healthcare coverage, and preventive care services",
        detailedCoverage: [
          "*Tax Benefits:* Eligible for tax deductions and savings",
          "*Health Savings Account:* HSA options for medical expenses",
          "*Essential Healthcare:* Basic medical coverage and services",
          "*Preventive Care:* Health screenings and wellness checks",
          "*High Deductible Structure:* Lower premiums with higher deductibles",
          "*Outpatient Services:* General medical consultations",
          "*Emergency Care:* Basic emergency medical services",
          "*Prescription Coverage:* Essential medication coverage",
        ],
      },
      {
        id: 14,
        title: "Chuks Plus HDPTC",
        cost: 56500,
        period: "year",
        currency: "NGN",
        description:
          "Enhanced HDPTC with lower deductibles, expanded preventive care coverage, specialist consultations, and comprehensive diagnostic services",
        detailedCoverage: [
          "*Lower Deductibles:* Reduced out-of-pocket costs before coverage",
          "*Expanded Preventive Care:* Comprehensive health screenings and wellness",
          "*Specialist Consultations:* Access to medical specialists",
          "*Comprehensive Diagnostics:* Laboratory tests and medical imaging",
          "*Enhanced Coverage:* Improved benefits over basic HDPTC",
          "*Tax Advantages:* Eligible for health savings account benefits",
          "*Prescription Coverage:* Enhanced medication benefits",
          "*Emergency Services:* Comprehensive emergency medical care",
        ],
      },
      {
        id: 15,
        title: "Chuks Senior HDPTC",
        cost: 275000,
        period: "year",
        currency: "NGN",
        description:
          "Senior-focused HDPTC with specialized geriatric care, chronic disease management, advanced investigations, and comprehensive elderly care services",
        detailedCoverage: [
          "*Specialized Geriatric Care:* Elderly-focused medical services",
          "*Chronic Disease Management:* Long-term condition care and monitoring",
          "*Advanced Investigations:* Comprehensive diagnostic procedures",
          "*Elderly Care Services:* Specialized care for senior health needs",
          "*Tax Benefits:* Senior-specific tax advantages and HSA options",
          "*Preventive Care:* Age-appropriate health screenings",
          "*Specialist Access:* Geriatricians and elderly care specialists",
          "*Emergency Services:* Priority emergency care for seniors",
        ],
      },
      {
        id: 16,
        title: "Chuks Senior Plus HDPTC",
        cost: 437000,
        period: "year",
        currency: "NGN",
        description:
          "Premium senior HDPTC with comprehensive coverage, priority healthcare services, intensive care, advanced diagnostics, and extensive chronic illness support",
        detailedCoverage: [
          "*Comprehensive Coverage:* Extensive medical benefits for seniors",
          "*Priority Healthcare Services:* Fast-track access to medical care",
          "*Intensive Care:* ICU services and critical care management",
          "*Advanced Diagnostics:* CT scans, MRI, and specialized tests",
          "*Extensive Chronic Illness Support:* Comprehensive long-term care",
          "*Premium Tax Benefits:* Maximum HSA contributions and deductions",
          "*Specialist Care:* Premium access to geriatric specialists",
          "*Emergency Services:* VIP emergency medical services",
        ],
      },

      // Chuks Gems (Naira)
      {
        id: 17,
        title: "Gems A",
        cost: 12400,
        period: "year",
        currency: "NGN",
        description:
          "Entry-level gems plan with basic healthcare coverage, outpatient services, essential diagnostics, and wellness benefits",
        detailedCoverage: [
          "*Basic Healthcare Coverage:* Essential medical services and treatments",
          "*Outpatient Services:* General medical consultations and care",
          "*Essential Diagnostics:* Basic laboratory tests and screenings",
          "*Wellness Benefits:* Preventive care and health promotion",
          "*Emergency Care:* Basic emergency medical services",
          "*Prescription Coverage:* Essential medication benefits",
          "*Preventive Screenings:* Basic health check-ups and monitoring",
          "*Primary Care:* Access to general practitioners and family doctors",
        ],
      },
      {
        id: 18,
        title: "Gems B",
        cost: 15000,
        period: "year",
        currency: "NGN",
        description:
          "Mid-tier gems coverage with enhanced outpatient services, diagnostic investigations, minor surgeries, and preventive care",
        detailedCoverage: [
          "*Enhanced Outpatient Services:* Improved medical consultations and care",
          "*Diagnostic Investigations:* Comprehensive laboratory tests and imaging",
          "*Minor Surgeries:* Small surgical procedures and treatments",
          "*Preventive Care:* Enhanced health screenings and wellness programs",
          "*Emergency Services:* Improved emergency medical coverage",
          "*Specialist Consultations:* Access to medical specialists",
          "*Prescription Benefits:* Enhanced medication coverage",
          "*Health Monitoring:* Regular check-ups and health assessments",
        ],
      },
      {
        id: 19,
        title: "Gems C",
        cost: 45000,
        period: "year",
        currency: "NGN",
        description:
          "Advanced gems plan with specialist care, comprehensive hospital coverage, intermediate surgeries, and advanced diagnostic services",
        detailedCoverage: [
          "*Specialist Care:* Access to medical specialists and consultants",
          "*Comprehensive Hospital Coverage:* Full inpatient services and care",
          "*Intermediate Surgeries:* Mid-level surgical procedures",
          "*Advanced Diagnostic Services:* Comprehensive medical imaging and tests",
          "*Emergency Care:* Advanced emergency medical services",
          "*Rehabilitation Services:* Physical therapy and recovery programs",
          "*Prescription Coverage:* Comprehensive medication benefits",
          "*Preventive Care:* Advanced health screenings and wellness",
        ],
      },
      {
        id: 20,
        title: "Gems D",
        cost: 120000,
        period: "year",
        currency: "NGN",
        description:
          "Premium gems tier with luxury healthcare facilities, personalized services, major surgery coverage, and comprehensive specialist care",
        detailedCoverage: [
          "*Luxury Healthcare Facilities:* Premium medical facilities and amenities",
          "*Personalized Services:* Dedicated healthcare coordination and support",
          "*Major Surgery Coverage:* Comprehensive surgical procedures",
          "*Comprehensive Specialist Care:* Full access to all medical specialists",
          "*VIP Emergency Services:* Priority emergency medical care",
          "*Advanced Diagnostics:* Premium medical imaging and testing",
          "*Concierge Services:* Personalized healthcare assistance",
          "*Wellness Programs:* Premium health and wellness services",
        ],
      },
      {
        id: 21,
        title: "Gems E",
        cost: 220000,
        period: "year",
        currency: "NGN",
        description:
          "Elite gems coverage with VIP treatment, exclusive medical centers, advanced procedures, and premium healthcare services",
        detailedCoverage: [
          "*VIP Treatment:* Exclusive and priority medical care",
          "*Exclusive Medical Centers:* Access to premium healthcare facilities",
          "*Advanced Procedures:* Cutting-edge medical treatments and surgeries",
          "*Premium Healthcare Services:* Luxury medical care and amenities",
          "*Elite Emergency Services:* VIP emergency medical response",
          "*Personalized Care Coordination:* Dedicated healthcare management",
          "*Global Healthcare Access:* International medical care options",
          "*Comprehensive Wellness:* Elite health and wellness programs",
        ],
      },
      {
        id: 22,
        title: "Gems F",
        cost: 3000000,
        period: "year",
        currency: "NGN",
        description:
          "Ultimate gems plan with world-class healthcare, unlimited coverage benefits, global treatment access, and premium concierge medical services",
        detailedCoverage: [
          "*World-Class Healthcare:* Access to the finest medical facilities globally",
          "*Unlimited Coverage Benefits:* No limits on medical expenses",
          "*Global Treatment Access:* Worldwide medical care and treatments",
          "*Premium Concierge Medical Services:* Personal healthcare coordination",
          "*Ultimate Emergency Services:* Global emergency medical response",
          "*Exclusive Specialist Access:* World-renowned medical specialists",
          "*Luxury Medical Facilities:* Premium healthcare environments",
          "*Comprehensive Global Wellness:* International health and wellness programs",
        ],
      },

      // Diaspora HDPTC (USD)
      {
        id: 23,
        title: "Chuks Basic Diaspora HDPTC",
        cost: 192,
        period: "year",
        currency: "USD",
        description:
          "International HDPTC with tax advantages, global healthcare access, essential coverage, and diaspora-specific benefits",
        detailedCoverage: [
          "*Tax Advantages:* International tax benefits and HSA eligibility",
          "*Global Healthcare Access:* Worldwide medical care coverage",
          "*Essential Coverage:* Basic international medical services",
          "*Diaspora-Specific Benefits:* Tailored coverage for overseas residents",
          "*High Deductible Structure:* Lower premiums with higher deductibles",
          "*Emergency Services:* Global emergency medical assistance",
          "*Preventive Care:* International health screenings and wellness",
          "*Prescription Coverage:* Essential medication benefits worldwide",
        ],
      },
      {
        id: 24,
        title: "Chuks Plus Diaspora HDPTC",
        cost: 244,
        period: "year",
        currency: "USD",
        description:
          "Enhanced diaspora HDPTC with reduced deductibles, premium network access, comprehensive coverage, and international healthcare benefits",
        detailedCoverage: [
          "*Reduced Deductibles:* Lower out-of-pocket costs before coverage",
          "*Premium Network Access:* Access to top-tier international providers",
          "*Comprehensive Coverage:* Enhanced international medical benefits",
          "*International Healthcare Benefits:* Global medical care advantages",
          "*Enhanced Tax Benefits:* Improved HSA contributions and deductions",
          "*Global Emergency Services:* Premium emergency medical assistance",
          "*Specialist Access:* International medical specialists",
          "*Advanced Diagnostics:* Global medical imaging and testing",
        ],
      },
      {
        id: 25,
        title: "Chuks Superior Diaspora HDPTC",
        cost: 262,
        period: "year",
        currency: "USD",
        description:
          "Superior international HDPTC with comprehensive global coverage, advanced healthcare access, and premium diaspora benefits",
        detailedCoverage: [
          "*Comprehensive Global Coverage:* Extensive worldwide medical benefits",
          "*Advanced Healthcare Access:* Premium international medical facilities",
          "*Premium Diaspora Benefits:* Superior coverage for overseas residents",
          "*Superior Tax Advantages:* Maximum HSA benefits and deductions",
          "*Global Specialist Network:* Access to world-class medical specialists",
          "*Advanced Emergency Services:* Superior global emergency care",
          "*Comprehensive Diagnostics:* Advanced international medical testing",
          "*Premium Wellness Programs:* Global health and wellness services",
        ],
      },
      {
        id: 26,
        title: "Chuks Senior Diaspora HDPTC",
        cost: 325,
        period: "year",
        currency: "USD",
        description:
          "Senior-focused international HDPTC with specialized geriatric care worldwide, chronic disease management, and comprehensive elderly healthcare services",
        detailedCoverage: [
          "*Specialized Geriatric Care:* Global elderly-focused medical services",
          "*Chronic Disease Management:* International long-term condition care",
          "*Comprehensive Elderly Healthcare:* Complete senior medical services",
          "*Senior Tax Benefits:* Maximum HSA advantages for seniors",
          "*Global Geriatric Specialists:* Access to elderly care experts worldwide",
          "*Priority Emergency Services:* Senior-focused global emergency care",
          "*Advanced Senior Diagnostics:* Age-appropriate medical testing",
          "*International Wellness Programs:* Global senior health and wellness",
        ],
      },
    ];
  }

  static async showPlans(userId) {
    const plansArray = this.getHealthPlans();

    let message = `🏥 *Health Insurance Plans*\n\n`;
    message += `Choose from our available plans:\n\n`;

    // Group plans by category
    message += `💰 *Basic Plans (Monthly)*\n`;
    plansArray.slice(0, 4).forEach((plan, index) => {
      const currency = plan.currency === "USD" ? "$" : "₦";
      message += `*${index + 1}️⃣ ${plan.title}*\n`;
      message += `Premium: ${currency}${Validators.formatAmount(plan.cost)}/${
        plan.period
      }\n\n`;
    });

    message += `🌍 *Diaspora Plans (Yearly - USD)*\n`;
    plansArray.slice(4, 12).forEach((plan, index) => {
      const globalIndex = index + 5;
      const currency = plan.currency === "USD" ? "$" : "₦";
      message += `*${globalIndex}️⃣ ${plan.title}*\n`;
      message += `Premium: ${currency}${Validators.formatAmount(plan.cost)}/${
        plan.period
      }\n\n`;
    });

    message += `🧾 *HDPTC Plans (Yearly)*\n`;
    plansArray.slice(12, 16).forEach((plan, index) => {
      const globalIndex = index + 13;
      const currency = plan.currency === "USD" ? "$" : "₦";
      message += `*${globalIndex}️⃣ ${plan.title}*\n`;
      message += `Premium: ${currency}${Validators.formatAmount(plan.cost)}/${
        plan.period
      }\n\n`;
    });

    message += `💎 *Chuks Gems (Yearly)*\n`;
    plansArray.slice(16, 22).forEach((plan, index) => {
      const globalIndex = index + 17;
      const currency = plan.currency === "USD" ? "$" : "₦";
      message += `*${globalIndex}️⃣ ${plan.title}*\n`;
      message += `Premium: ${currency}${Validators.formatAmount(plan.cost)}/${
        plan.period
      }\n\n`;
    });

    message += `🌍 *Diaspora HDPTC (Yearly - USD)*\n`;
    plansArray.slice(22).forEach((plan, index) => {
      const globalIndex = index + 23;
      const currency = plan.currency === "USD" ? "$" : "₦";
      message += `*${globalIndex}️⃣ ${plan.title}*\n`;
      message += `Premium: ${currency}${Validators.formatAmount(plan.cost)}/${
        plan.period
      }\n\n`;
    });

    message += `\n_Reply with a number (1-${plansArray.length}) to select a plan._`;
    message += `\n_Or reply with the number + 'D' (e.g., 1D) to view detailed coverage._`;

    SessionManager.updateSession(userId, STATES.HEALTH_PLANS_LIST, {
      availablePlans: plansArray,
    });

    return {
      message,
      state: STATES.HEALTH_PLANS_LIST,
    };
  }

  static async handlePlanDetails(userId, input, text) {
    // Check for global commands first (including "back")
    const globalResponse = this.handleGlobalCommands(
      userId,
      input,
      STATES.HEALTH_PLAN_DETAILS
    );
    if (globalResponse) {
      // If going back to plans list, show the plans again
      if (globalResponse.state === STATES.HEALTH_PLANS_LIST) {
        SessionManager.updateSession(userId, STATES.HEALTH_PLANS_LIST);
        return this.showPlans(userId);
      }
      return globalResponse;
    }

    // Handle plan selection from details view
    return this.handlePlanSelection(userId, input, text);
  }

  static async handlePlanSelection(userId, input, text) {
    const session = SessionManager.getSession(userId);
    const plans = session.data.availablePlans || [];

    // Check if user wants to view details (e.g., "1D")
    if (input.includes("d") || input.includes("detail")) {
      const planNumber = parseInt(input.replace(/d|detail/gi, "").trim());

      if (planNumber >= 1 && planNumber <= plans.length) {
        const selectedPlan = plans[planNumber - 1];
        if (selectedPlan.detailedCoverage) {
          const currency = selectedPlan.currency === "USD" ? "$" : "₦";
          let message = `📋 *${selectedPlan.title}*\n\n`;
          message += `*Premium:* ${currency}${Validators.formatAmount(
            selectedPlan.cost
          )}/${selectedPlan.period}\n`;
          if (selectedPlan.annualLimit) {
            message += `*Annual Medical Limit:* ${selectedPlan.annualLimit}\n\n`;
          }
          message += `*Coverage Details:*\n\n`;

          selectedPlan.detailedCoverage.forEach((item) => {
            message += `${item}\n\n`;
          });

          message += `Type ${planNumber} to select this plan, or type BACK to see all plans.`;

          return {
            message,
            state: STATES.HEALTH_PLAN_DETAILS,
          };
        } else {
          // Fallback for plans without detailed info
          let message = `📋 *${selectedPlan.title}*\n\n`;
          message += `*Premium:* ${
            selectedPlan.currency === "USD" ? "$" : "₦"
          }${Validators.formatAmount(selectedPlan.cost)}/${
            selectedPlan.period
          }\n\n`;
          message += `*Coverage:* ${selectedPlan.description}\n\n`;
          message += `Type ${planNumber} to select this plan, or type BACK to see all plans.`;

          return {
            message,
            state: STATES.HEALTH_PLAN_DETAILS,
          };
        }
      }
    }

    // Regular plan selection
    const planNumber = parseInt(input);

    if (planNumber >= 1 && planNumber <= plans.length) {
      const selectedPlan = plans[planNumber - 1];

      SessionManager.updateSession(userId, STATES.HEALTH_REG_SURNAME, {
        selectedPlan: selectedPlan,
        planId: selectedPlan.id || selectedPlan.plan_id,
        planName: selectedPlan.title,
        planPremium: selectedPlan.cost,
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
    // Check for global commands first
    const globalResponse = this.handleGlobalCommands(
      userId,
      input,
      STATES.HEALTH_REG_SURNAME
    );
    if (globalResponse) return globalResponse;

    const session = SessionManager.getSession(userId);
    const isEditMode = session.data.editMode;

    // Store surname data but don't advance state yet
    SessionManager.updateSession(userId, STATES.HEALTH_REG_SURNAME, {
      surname: text,
    });

    // If in edit mode, go directly to review after updating
    if (isEditMode) {
      SessionManager.updateSession(userId, STATES.HEALTH_REVIEW, {
        editMode: false,
      });
      return this.showReviewSummary(userId);
    }

    // Now advance to next state
    SessionManager.updateSession(userId, STATES.HEALTH_REG_MIDDLENAME);

    return {
      message: `What is your *Middle Name*?\n\n_Type "SKIP" if you don't have a middle name._\n\n_Type "BACK" to go to previous step._`,
      state: STATES.HEALTH_REG_MIDDLENAME,
    };
  }

  static handleMiddleName(userId, input, text) {
    // Check for global commands first
    const globalResponse = this.handleGlobalCommands(
      userId,
      input,
      STATES.HEALTH_REG_MIDDLENAME
    );
    if (globalResponse) return globalResponse;

    const middleName = input === "skip" ? "" : text;

    // Store data but don't advance state yet
    SessionManager.updateSession(userId, STATES.HEALTH_REG_MIDDLENAME, {
      middlename: middleName,
    });

    // Now advance to next state
    SessionManager.updateSession(userId, STATES.HEALTH_REG_FIRSTNAME);

    return {
      message: `What is your *First Name*?\n\n_Type "BACK" to go to previous step._`,
      state: STATES.HEALTH_REG_FIRSTNAME,
    };
  }

  static handleFirstName(userId, input, text) {
    // Check for global commands first
    const globalResponse = this.handleGlobalCommands(
      userId,
      input,
      STATES.HEALTH_REG_FIRSTNAME
    );
    if (globalResponse) return globalResponse;

    // Store data but don't advance state yet
    SessionManager.updateSession(userId, STATES.HEALTH_REG_FIRSTNAME, {
      firstname: text,
    });

    // Now advance to next state
    SessionManager.updateSession(userId, STATES.HEALTH_REG_EMAIL);

    return {
      message: `What is your *Email Address*?\n\n_Please enter a valid email address_\n_Example: john@example.com_\n\n_Type "BACK" to go to previous step._`,
      state: STATES.HEALTH_REG_EMAIL,
    };
  }

  static handleEmail(userId, input, text) {
    console.log(`Email handler called for user ${userId} with input: ${text}`);

    // Check for global commands first
    const globalResponse = this.handleGlobalCommands(
      userId,
      input,
      STATES.HEALTH_REG_EMAIL
    );
    if (globalResponse) return globalResponse;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(text)) {
      console.log(`Invalid email format: ${text}`);
      return {
        message: `Please enter a valid email address.\n\n_Example: john@example.com_\n\n_Type "BACK" to go to previous step._`,
        state: STATES.HEALTH_REG_EMAIL,
      };
    }

    console.log(`Valid email received: ${text}`);
    // Store data but don't advance state yet
    SessionManager.updateSession(userId, STATES.HEALTH_REG_EMAIL, {
      email: text,
    });

    // Now advance to next state
    SessionManager.updateSession(userId, STATES.HEALTH_REG_PHONE);

    return {
      message: `What is your *Phone Number*?\n\n_Please enter your 11-digit Nigerian phone number_\n_Example: 08012345678_\n\n_Type "BACK" to go to previous step._`,
      state: STATES.HEALTH_REG_PHONE,
    };
  }

  static handlePhone(userId, input, text) {
    // Check for global commands first
    const globalResponse = this.handleGlobalCommands(
      userId,
      input,
      STATES.HEALTH_REG_PHONE
    );
    if (globalResponse) return globalResponse;

    // Remove spaces and validate Nigerian phone
    const phone = text.replace(/\s/g, "");
    const phoneRegex = /^0[789][01]\d{8}$/;

    if (!phoneRegex.test(phone)) {
      return {
        message: `Please enter a valid 11-digit Nigerian phone number.\n\n_Example: 08012345678_\n\n_Type "BACK" to go to previous step._`,
        state: STATES.HEALTH_REG_PHONE,
      };
    }

    // Store data but don't advance state yet
    SessionManager.updateSession(userId, STATES.HEALTH_REG_PHONE, {
      phone: phone,
    });

    // Now advance to next state
    SessionManager.updateSession(userId, STATES.HEALTH_REG_MARITAL);

    return {
      message: `*Step 2: Demographics*\n\nWhat is your *Marital Status*?\n\n1️⃣ Single\n2️⃣ Married\n3️⃣ Widowed\n4️⃣ Separated\n5️⃣ Divorced\n\n_Type "BACK" to go to previous step._`,
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

    const session = SessionManager.getSession(userId);
    const isEditMode = session.data.editMode;

    // Store data but don't advance state yet
    SessionManager.updateSession(userId, STATES.HEALTH_REG_MARITAL, {
      marital_status: maritalStatus,
    });

    // If in edit mode, go directly to review after updating
    if (isEditMode) {
      SessionManager.updateSession(userId, STATES.HEALTH_REVIEW, {
        editMode: false,
      });
      return this.showReviewSummary(userId);
    }

    // Now advance to next state
    SessionManager.updateSession(userId, STATES.HEALTH_REG_STATE);

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
    const isEditMode = session.data.editMode;

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

    // Store data but don't advance state yet
    SessionManager.updateSession(userId, STATES.HEALTH_REG_STATE, {
      state: stateName,
      stateId: stateId,
      // Clear LGA data when state changes
      lga: null,
      lgaId: null,
    });

    // If in edit mode, go directly to review after updating
    if (isEditMode) {
      SessionManager.updateSession(userId, STATES.HEALTH_REVIEW, {
        editMode: false,
      });
      return this.showReviewSummary(userId);
    }

    // Now advance to next state
    SessionManager.updateSession(userId, STATES.HEALTH_REG_LGA);

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

    // Store data but don't advance state yet
    SessionManager.updateSession(userId, STATES.HEALTH_REG_LGA, {
      lga: lgaName,
      lgaId: lgaId,
    });

    // Now advance to next state
    SessionManager.updateSession(userId, STATES.HEALTH_REG_ADDRESS);

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

    const session = SessionManager.getSession(userId);
    const isEditMode = session.data.editMode;

    // Store data but don't advance state yet
    SessionManager.updateSession(userId, STATES.HEALTH_REG_ADDRESS, {
      address: text,
    });

    // If in edit mode, go directly to review after updating
    if (isEditMode) {
      SessionManager.updateSession(userId, STATES.HEALTH_REVIEW, {
        editMode: false,
      });
      return this.showReviewSummary(userId);
    }

    // Now advance to next state
    SessionManager.updateSession(userId, STATES.HEALTH_PROVIDER_SELECT);

    return LoadingWrapper.callWithLoading(
      userId,
      "Loading healthcare providers...",
      async () => {
        const session = SessionManager.getSession(userId);
        const userLgaId = session.data.lgaId;

        const providersResult = await kampeAPI.getProviders();

        if (!providersResult.success || !providersResult.data) {
          SessionManager.updateSession(userId, STATES.MAIN_MENU);
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

          message += `\n_Reply with a number (1-${lgaProviders.length}) to select a provider._`;
          message += `\n_Type "CHANGE LGA" to select a different area._`;
          message += `\n_Or type a provider name to search (e.g., "General Hospital")._`;
          message += `\n\n📝 *Please select a healthcare provider, not your address.*`;

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

          message += `\n_Reply with a number (1-${displayProviders.length}) to select a provider._`;
          message += `\n_Type "CHANGE LGA" to select a different area._`;
          message += `\n\n📝 *Note: Please select a healthcare provider from the list above.*`;

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
      }
    );
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
    message += `Email: ${data.email}\n`;
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
        SessionManager.updateSession(userId, STATES.HEALTH_REVIEW);
        return this.showReviewSummary(userId);
      }
      return {
        message: `Please select a valid option (1-5).`,
        state: STATES.HEALTH_REVIEW_EDIT,
      };
    }

    // Set edit mode flag
    SessionManager.updateSession(userId, nextState, {
      editMode: true,
    });

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

        email: data.email || "customer@example.com", // Now collected during registration

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
      const GlobalPayAPIService = (
        await import("../services/globalPayApiService.js")
      ).GlobalPayAPIService;
      const globalPayService = new GlobalPayAPIService();
      const merchantTransactionReference = `HEALTH_${userId}_${Date.now()}`;

      // Calculate service charge (3%)
      const serviceCharge = Math.round(premium * 0.03);
      const totalAmount = premium + serviceCharge;

      const paymentDetails = {
        amount: totalAmount,
        currency: data.selectedPlan?.currency === "USD" ? "USD" : "NGN",
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
        const currency = data.selectedPlan?.currency === "USD" ? "$" : "₦";
        message += `Premium: ${currency}${Validators.formatAmount(premium)}\n`;
        message += `Service Charge (3%): ${currency}${Validators.formatAmount(
          serviceCharge
        )}\n`;
        message += `*Total Amount: ${currency}${Validators.formatAmount(
          totalAmount
        )}*\n\n`;
        message += `_A 3% service charge will be automatically applied at the point of checkout._\n\n`;
        message += `Click the link below to pay:\n${result.data.checkoutUrl}\n\n`;
        message += `After payment, reply "DONE" to activate your policy.\n\n`;
        message += `_Type "CANCEL" to cancel payment and return to main menu._`;

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
      console.error("GlobalPay initialization error:", error);
      SessionManager.updateSession(userId, STATES.HEALTH_REVIEW);
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

    if (input.includes("cancel") || input === "menu") {
      SessionManager.clearSession(userId);
      return {
        message: `Payment cancelled. Your registration has been cancelled.\n\nType MENU to return to main menu.`,
        state: STATES.MAIN_MENU,
      };
    }

    return {
      message: `Please complete your payment using the link provided, then reply "DONE" to verify.\n\n_Type "CANCEL" to cancel payment and return to main menu._`,
      state: STATES.PAYMENT_CONFIRMATION,
    };
  }

  static async verifyGlobalPayPayment(userId) {
    const session = SessionManager.getSession(userId);
    const merchantTransactionReference =
      session.data.merchantTransactionReference;

    if (!merchantTransactionReference) {
      SessionManager.updateSession(userId, STATES.HEALTH_REVIEW);
      return {
        message: `Payment reference not found. Please try the payment process again.`,
        state: STATES.HEALTH_REVIEW,
      };
    }

    try {
      const GlobalPayAPIService = (
        await import("../services/globalPayApiService.js")
      ).GlobalPayAPIService;
      const globalPayService = new GlobalPayAPIService();

      const verificationResult = await globalPayService.verifyPayment(
        merchantTransactionReference
      );

      // Check various possible success indicators
      const isSuccessful =
        verificationResult.success &&
        (verificationResult.data.status === "successful" ||
          verificationResult.data.status === "success" ||
          verificationResult.data.status === "completed" ||
          verificationResult.data.paymentStatus === "successful" ||
          verificationResult.data.paid === true);

      if (isSuccessful) {
        // Payment verified, now process Kampe enrollment
        return this.initiateKampeEnrollment(userId);
      } else {
        console.log("Payment verification response:", verificationResult.data);
        return {
          message: `❌ Payment not confirmed yet. Please ensure you've completed payment and try again.\n\nReply "DONE" to check again.`,
          state: STATES.PAYMENT_CONFIRMATION,
        };
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      SessionManager.updateSession(userId, STATES.MAIN_MENU);
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
      SessionManager.updateSession(userId, STATES.MAIN_MENU);
      return {
        message: `Enrollment data not found. Please contact support.`,
        state: STATES.MAIN_MENU,
      };
    }

    try {
      console.log("⏳ Processing Kampe enrollment...");
      const enrollmentResult = await kampeAPI.createEnrollment(
        kampeEnrollmentData
      );

      if (enrollmentResult.message === "Successfully created user!") {
        SessionManager.clearSession(userId);

        let message = `✅ *Health Insurance Registration Complete!*\n\n`;
        message += `🎉 Your health insurance policy has been successfully created!\n\n`;
        message += `📋 *Registration Details:*\n`;
        message += `Name: ${kampeEnrollmentData.firstname} ${
          kampeEnrollmentData.middlename || ""
        } ${kampeEnrollmentData.lastname}\n`;
        message += `Provider ID: ${kampeEnrollmentData.provider_id}\n`;
        message += `Location: ${session.data.lga}, ${session.data.state}\n\n`;
        message += `You will receive confirmation details shortly.\n\n`;
        message += `Type MENU to return to main menu.`;

        return {
          message,
          state: STATES.MAIN_MENU,
        };
      } else {
        SessionManager.updateSession(userId, STATES.MAIN_MENU);
        return {
          message: `Registration failed: ${
            enrollmentResult.message || enrollmentResult.error
          }\n\nPlease contact support.`,
          state: STATES.MAIN_MENU,
        };
      }
    } catch (error) {
      console.error("Kampe enrollment error:", error);
      SessionManager.updateSession(userId, STATES.MAIN_MENU);
      return {
        message: `An error occurred during registration. Please contact support.`,
        state: STATES.MAIN_MENU,
      };
    }
  }
}
