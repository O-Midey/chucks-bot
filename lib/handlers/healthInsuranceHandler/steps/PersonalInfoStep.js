import { BaseStep } from "./BaseStep.js";
import { STATES } from "../../../config/constants.js";
import { HealthInsuranceValidator } from "../validators/HealthInsuranceValidator.js";
import { SessionManager } from "../../../session/sessionManager.js";

export class PersonalInfoStep extends BaseStep {
  async handleSurname(input, text) {
    const globalResponse = await this.handleGlobalCommands(
      input,
      STATES.HEALTH_REG_SURNAME
    );
    if (globalResponse) return globalResponse;

    const session = SessionManager.getSession(this.userId);
    const isEditMode = session.data.editMode;

    this.updateSession(STATES.HEALTH_REG_SURNAME, { surname: text });

    if (isEditMode) {
      this.updateSession(STATES.HEALTH_PERSONAL_EDIT, { editMode: false });
      return this.createResponse(
        `What personal information would you like to edit?\n\n1️⃣ Surname\n2️⃣ Middle Name\n3️⃣ First Name\n4️⃣ Email\n5️⃣ Phone\n6️⃣ Cancel`,
        STATES.HEALTH_PERSONAL_EDIT
      );
    }

    this.updateSession(STATES.HEALTH_REG_MIDDLENAME);
    return this.createResponse(
      `What is your *Middle Name*?\n\n_Type "SKIP" if you don't have a middle name._\n\n_Type "BACK" to go to previous step._`,
      STATES.HEALTH_REG_MIDDLENAME
    );
  }

  async handleMiddleName(input, text) {
    const globalResponse = await this.handleGlobalCommands(
      input,
      STATES.HEALTH_REG_MIDDLENAME
    );
    if (globalResponse) return globalResponse;

    const middleName = input === "skip" ? "" : text;
    this.updateSession(STATES.HEALTH_REG_MIDDLENAME, {
      middlename: middleName,
    });
    this.updateSession(STATES.HEALTH_REG_FIRSTNAME);

    return this.createResponse(
      `What is your *First Name*?\n\n_Type "BACK" to go to previous step._`,
      STATES.HEALTH_REG_FIRSTNAME
    );
  }

  async handleFirstName(input, text) {
    const globalResponse = await this.handleGlobalCommands(
      input,
      STATES.HEALTH_REG_FIRSTNAME
    );
    if (globalResponse) return globalResponse;

    this.updateSession(STATES.HEALTH_REG_FIRSTNAME, { firstname: text });
    this.updateSession(STATES.HEALTH_REG_EMAIL);

    return this.createResponse(
      `What is your *Email Address*?\n\n_Please enter a valid email address_\n_Example: john@example.com_\n\n_Type "BACK" to go to previous step._`,
      STATES.HEALTH_REG_EMAIL
    );
  }

  async handleEmail(input, text) {
    const globalResponse = await this.handleGlobalCommands(
      input,
      STATES.HEALTH_REG_EMAIL
    );
    if (globalResponse) return globalResponse;

    if (!HealthInsuranceValidator.validateEmail(text)) {
      return this.createResponse(
        `Please enter a valid email address.\n\n_Example: john@example.com_\n\n_Type "BACK" to go to previous step._`,
        STATES.HEALTH_REG_EMAIL
      );
    }

    const session = SessionManager.getSession(this.userId);
    const isEditMode = session.data.editMode;

    this.updateSession(STATES.HEALTH_REG_EMAIL, { email: text });

    if (isEditMode) {
      this.updateSession(STATES.HEALTH_PERSONAL_EDIT, { editMode: false });
      return this.createResponse(
        `What personal information would you like to edit?\n\n1️⃣ Surname\n2️⃣ Middle Name\n3️⃣ First Name\n4️⃣ Email\n5️⃣ Phone\n6️⃣ Cancel`,
        STATES.HEALTH_PERSONAL_EDIT
      );
    }

    this.updateSession(STATES.HEALTH_REG_PHONE);
    return this.createResponse(
      `What is your *Phone Number*?\n\n_Please enter your 11-digit Nigerian phone number_\n_Example: 08012345678_\n\n_Type "BACK" to go to previous step._`,
      STATES.HEALTH_REG_PHONE
    );
  }

  async handlePhone(input, text) {
    const globalResponse = await this.handleGlobalCommands(
      input,
      STATES.HEALTH_REG_PHONE
    );
    if (globalResponse) return globalResponse;

    const phone = HealthInsuranceValidator.sanitizePhone(text);

    if (!HealthInsuranceValidator.validatePhone(phone)) {
      return this.createResponse(
        `Please enter a valid 11-digit Nigerian phone number.\n\n_Example: 08012345678_\n\n_Type "BACK" to go to previous step._`,
        STATES.HEALTH_REG_PHONE
      );
    }

    const session = SessionManager.getSession(this.userId);
    const isEditMode = session.data.editMode;

    this.updateSession(STATES.HEALTH_REG_PHONE, { phone });

    if (isEditMode) {
      this.updateSession(STATES.HEALTH_PERSONAL_EDIT, { editMode: false });
      return this.createResponse(
        `What personal information would you like to edit?\n\n1️⃣ Surname\n2️⃣ Middle Name\n3️⃣ First Name\n4️⃣ Email\n5️⃣ Phone\n6️⃣ Cancel`,
        STATES.HEALTH_PERSONAL_EDIT
      );
    }

    this.updateSession(STATES.HEALTH_REG_MARITAL);
    return this.createResponse(
      `*Step 2: Demographics*\n\nWhat is your *Marital Status*?\n\n1️⃣ Single\n2️⃣ Married\n3️⃣ Widowed\n4️⃣ Separated\n5️⃣ Divorced\n\n_Type "BACK" to go to previous step._`,
      STATES.HEALTH_REG_MARITAL
    );
  }

  async handleMaritalStatus(input) {
    const statuses = {
      1: "single",
      2: "married",
      3: "widowed",
      4: "separated",
      5: "divorced",
    };

    const maritalStatus = statuses[input];
    if (!maritalStatus) {
      return this.createResponse(
        `Please select a valid option (1-5).`,
        STATES.HEALTH_REG_MARITAL
      );
    }

    const session = SessionManager.getSession(this.userId);
    const isEditMode = session.data.editMode;

    this.updateSession(STATES.HEALTH_REG_MARITAL, {
      marital_status: maritalStatus,
    });

    if (isEditMode) {
      this.updateSession(STATES.HEALTH_PERSONAL_EDIT, { editMode: false });
      return this.createResponse(
        `What personal information would you like to edit?\n\n1️⃣ Surname\n2️⃣ Middle Name\n3️⃣ First Name\n4️⃣ Email\n5️⃣ Phone\n6️⃣ Cancel`,
        STATES.HEALTH_PERSONAL_EDIT
      );
    }

    this.updateSession(STATES.HEALTH_REG_STATE);
    const LocationStep = (await import("./LocationStep.js")).LocationStep;
    return new LocationStep(this.userId).fetchAndShowStates();
  }
}
