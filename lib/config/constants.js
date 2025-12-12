export const BASE_URL = "https://waba-v2.360dialog.io";
export const SESSION_TIMEOUT = 10 * 60 * 1000;

export const STATES = {
  MAIN_MENU: "main_menu",
  QUOTE_CATEGORY: "quote_category",
  HEALTH_PLANS_LIST: "health_plans_list",
  HEALTH_PLAN_DETAILS: "health_plan_details",

  // Health Insurance Registration Steps
  // Step 0: Provider Selection
  HEALTH_PROVIDER_SELECT: "health_provider_select",
  
  // Step 1: Personal Information
  HEALTH_REG_SURNAME: "health_reg_surname",
  HEALTH_REG_MIDDLENAME: "health_reg_middlename",
  HEALTH_REG_FIRSTNAME: "health_reg_firstname",
  HEALTH_REG_DOB: "health_reg_dob",
  HEALTH_REG_EMAIL: "health_reg_email",
  HEALTH_REG_PHONE: "health_reg_phone",

  // Step 2: Demographics
  HEALTH_REG_GENDER: "health_reg_gender",
  HEALTH_REG_MARITAL: "health_reg_marital",

  // Step 3: Location
  HEALTH_REG_STATE: "health_reg_state",
  HEALTH_REG_LGA: "health_reg_lga",
  HEALTH_REG_HOSPITAL: "health_reg_hospital",

  // Step 4: Additional Info
  HEALTH_REG_BLOODGROUP: "health_reg_bloodgroup",
  HEALTH_REG_ADDRESS: "health_reg_address",

  // Step 5: Declarations
  HEALTH_DECLARATION_1: "health_declaration_1",
  HEALTH_DECLARATION_2: "health_declaration_2",
  HEALTH_DECLARATION_3: "health_declaration_3",

  // Step 6: Review & Payment
  HEALTH_REVIEW: "health_review",
  HEALTH_REVIEW_EDIT: "health_review_edit",
  HEALTH_PAYMENT: "health_payment",
  HEALTH_PAYMENT_VERIFY: "health_payment_verify",
  HEALTH_POLICY_ACTIVATED: "health_policy_activated",

  AUTO_TYPE: "auto_type",
  AUTO_BRAND: "auto_brand",
  AUTO_MODEL: "auto_model",
  AUTO_YEAR: "auto_year",
  AUTO_VALUE: "auto_value",
  AUTO_PLANS: "auto_plans",
  DEVICE_TYPE: "device_type",
  DEVICE_BRAND: "device_brand",
  DEVICE_MODEL: "device_model",
  DEVICE_CONDITION: "device_condition",
  DEVICE_VALUE: "device_value",
  DEVICE_PLANS: "device_plans",
  LIFE_AGE: "life_age",
  LIFE_DEPENDENTS: "life_dependents",
  LIFE_SUM: "life_sum",
  LIFE_CONDITIONS: "life_conditions",
  LIFE_PLANS: "life_plans",
  PROPERTY_TYPE: "property_type",
  PROPERTY_STATE: "property_state",
  PROPERTY_VALUE: "property_value",
  PROPERTY_COVERAGE: "property_coverage",
  PROPERTY_PLANS: "property_plans",
  SALARY_AMOUNT: "salary_amount",
  SALARY_EMPLOYMENT: "salary_employment",
  SALARY_COVERAGE: "salary_coverage",
  SALARY_PLANS: "salary_plans",
  CREDIT_AMOUNT: "credit_amount",
  CREDIT_DURATION: "credit_duration",
  CREDIT_TYPE: "credit_type",
  CREDIT_PLANS: "credit_plans",
  PAYMENT_METHOD: "payment_method",
  PAYMENT_CONFIRMATION: "payment_confirmation",
  POLICY_LOOKUP: "policy_lookup",
  POLICY_OPTIONS: "policy_options",
  CLAIMS_MENU: "claims_menu",
  CLAIM_TYPE: "claim_type",
  CLAIM_DESCRIPTION: "claim_description",
  CLAIM_LOCATION: "claim_location",
  CLAIM_DOCUMENTS: "claim_documents",
  CLAIM_TRACKING: "claim_tracking",
  LEARN_PRODUCTS: "learn_products",
  PRODUCT_DETAIL: "product_detail",
  FAQ_CATEGORY: "faq_category",
  AGENT_CONNECT: "agent_connect",
};
