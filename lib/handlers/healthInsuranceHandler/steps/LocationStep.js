import { BaseStep } from "./BaseStep.js";
import { STATES } from "../../../config/constants.js";
import { KampeAPIService } from "../../../services/kampeApiService.js";
import { SessionManager } from "../../../session/sessionManager.js";
import { HealthInsuranceValidator } from "../validators/HealthInsuranceValidator.js";
import { cacheService } from "../../../services/cacheService.js";

const kampeAPI = new KampeAPIService(process.env.KAMPE_BEARER_TOKEN);

export class LocationStep extends BaseStep {
  // Helper method to format numbers with proper emojis
  formatNumberEmoji(number) {
    const emojiMap = {
      1: "1️⃣",
      2: "2️⃣",
      3: "3️⃣",
      4: "4️⃣",
      5: "5️⃣",
      6: "6️⃣",
      7: "7️⃣",
      8: "8️⃣",
      9: "9️⃣",
      10: "🔟",
      11: "1️⃣1️⃣",
      12: "1️⃣2️⃣",
      13: "1️⃣3️⃣",
      14: "1️⃣4️⃣",
      15: "1️⃣5️⃣",
      16: "1️⃣6️⃣",
      17: "1️⃣7️⃣",
      18: "1️⃣8️⃣",
      19: "1️⃣9️⃣",
      20: "2️⃣0️⃣",
      21: "2️⃣1️⃣",
      22: "2️⃣2️⃣",
      23: "2️⃣3️⃣",
      24: "2️⃣4️⃣",
      25: "2️⃣5️⃣",
      26: "2️⃣6️⃣",
      27: "2️⃣7️⃣",
      28: "2️⃣8️⃣",
      29: "2️⃣9️⃣",
      30: "3️⃣0️⃣",
    };
    return emojiMap[number] || `${number}.`;
  }

  async fetchAndShowStates() {
    try {
      // Try cache first
      let statesArray = await cacheService.getStates();
      // If cache contains a very small list (likely from local tests/mocks), treat as a miss
      if (
        Array.isArray(statesArray) &&
        statesArray.length > 0 &&
        statesArray.length < 5
      ) {
        console.warn(
          `kampe:states cache contains only ${statesArray.length} entries - treating as stale and refetching`
        );
        statesArray = null;
      }
      if (!statesArray) {
        // Cache miss - fetch from API
        const statesResult = await kampeAPI.getStates();

        if (!statesResult.success || !statesResult.data) {
          return this.createResponse(
            `*Step 3: Location Details*\n\nWhat *State* do you live in?\n\n_Please type your state name (e.g., Lagos)_`,
            STATES.HEALTH_REG_STATE
          );
        }

        statesArray = this.extractArrayData(statesResult.data, [
          "states",
          "data",
        ]);

        // Cache the result
        await cacheService.setStates(statesArray);
      }

      let message = `*Step 3: Location Details*\n\nWhat *State* do you live in?\n\n`;
      statesArray.slice(0, 15).forEach((state, index) => {
        message += `${this.formatNumberEmoji(index + 1)} ${state.name}\n`;
      });
      message += `\n_Reply with number or type state name._`;

      await this.updateSession(STATES.HEALTH_REG_STATE, {
        availableStates: statesArray,
      });
      return this.createResponse(message, STATES.HEALTH_REG_STATE);
    } catch (error) {
      console.error("Error fetching states:", error);
      return this.createResponse(
        `*Step 3: Location Details*\n\nWhat *State* do you live in?\n\n_Please type your state name_`,
        STATES.HEALTH_REG_STATE
      );
    }
  }

  async handleState(input, text) {
    const session = await SessionManager.getSession(this.userId);
    const availableStates = session.data.availableStates || [];
    const isEditMode = session.data.editMode;

    const { selected: selectedState, id: stateId } =
      this.findItemByNumberOrName(
        input,
        text,
        availableStates,
        ["name", "state_name"],
        ["id", "state_id"]
      );

    if (!selectedState && availableStates.length > 0) {
      return this.createResponse(
        `State not found. Please select from the list or type the exact name.`,
        STATES.HEALTH_REG_STATE
      );
    }

    const stateName = selectedState
      ? selectedState.name || selectedState.state_name
      : text;

    this.updateSession(STATES.HEALTH_REG_STATE, {
      state: stateName,
      stateId: stateId,
      // Clear LGA data when state changes
      lga: null,
      lgaId: null,
      availableLGAs: null,
    });

    // Continue to LGA selection regardless of edit mode
    this.updateSession(STATES.HEALTH_REG_LGA);
    return stateId
      ? this.fetchAndShowLGAs(stateId)
      : this.createResponse(
          `What is your *Local Government Area (LGA)*?\n\n_Please type your LGA name_`,
          STATES.HEALTH_REG_LGA
        );
  }

  async fetchAndShowLGAs(stateId) {
    try {
      // Try cache first
      let lgasArray = await cacheService.getLGAs(stateId);

      if (!lgasArray) {
        // Cache miss - fetch from API
        const lgasResult = await kampeAPI.getLGAs(stateId);

        if (!lgasResult.success || !lgasResult.data) {
          return this.createResponse(
            `What is your *Local Government Area (LGA)*?\n\n_Please type your LGA name_`,
            STATES.HEALTH_REG_LGA
          );
        }

        lgasArray = this.extractArrayData(lgasResult.data, ["lgas", "data"]);

        // Cache the result
        await cacheService.setLGAs(stateId, lgasArray);
      }

      let message = `Select your *Local Government Area (LGA)*:\n\n`;
      lgasArray.slice(0, 20).forEach((lga, index) => {
        const lgaName = lga.local_name || lga.lga_name || "Unnamed LGA";
        message += `${this.formatNumberEmoji(index + 1)} ${lgaName}\n`;
      });
      message += `\n_Reply with number or type LGA name._`;

      await this.updateSession(STATES.HEALTH_REG_LGA, {
        availableLGAs: lgasArray,
      });
      return this.createResponse(message, STATES.HEALTH_REG_LGA);
    } catch (error) {
      console.error("Error fetching LGAs:", error);
      return this.createResponse(
        `What is your *Local Government Area (LGA)*?\n\n_Please type your LGA name_`,
        STATES.HEALTH_REG_LGA
      );
    }
  }

  async handleLGA(input, text) {
    const session = await SessionManager.getSession(this.userId);
    const availableLGAs = session.data.availableLGAs || [];

    const { selected: selectedLGA, id: lgaId } = this.findItemByNumberOrName(
      input,
      text,
      availableLGAs,
      ["name", "lga_name", "local_name"],
      ["id", "lga_id"]
    );

    const lgaName = selectedLGA
      ? selectedLGA.local_name || selectedLGA.lga_name || selectedLGA.name
      : text;

    this.updateSession(STATES.HEALTH_REG_LGA, { lga: lgaName, lgaId });
    this.updateSession(STATES.HEALTH_REG_ADDRESS);

    return this.createResponse(
      `*Step 4: Address Information*\n\nWhat is your *Home Address*?\n\n_Please provide your full residential address._`,
      STATES.HEALTH_REG_ADDRESS
    );
  }

  async handleAddress(input, text) {
    if (!HealthInsuranceValidator.validateAddress(text)) {
      return this.createResponse(
        `Please provide a complete address (at least 10 characters).`,
        STATES.HEALTH_REG_ADDRESS
      );
    }

    const session = await SessionManager.getSession(this.userId);
    const isEditMode = session.data.editMode;

    this.updateSession(STATES.HEALTH_REG_ADDRESS, { address: text });

    if (isEditMode) {
      this.updateSession(STATES.HEALTH_REVIEW, { editMode: false });
      const ReviewStep = (await import("./ReviewStep.js")).default;
      return new ReviewStep(this.userId).showReviewSummary();
    }

    this.updateSession(STATES.HEALTH_PROVIDER_SELECT);
    const ProviderSelectionStep = (await import("./ProviderSelectionStep.js"))
      .ProviderSelectionStep;
    return new ProviderSelectionStep(this.userId).loadAndShowProviders();
  }

  // Helper methods
  extractArrayData(data, possibleKeys) {
    if (Array.isArray(data)) return data;
    for (const key of possibleKeys) {
      if (data[key]) return data[key];
    }
    return [];
  }

  findItemByNumberOrName(input, text, items, nameKeys, idKeys) {
    const inputNumber = parseInt(input);
    let selected = null;
    let id = null;

    if (!isNaN(inputNumber) && inputNumber > 0 && inputNumber <= items.length) {
      selected = items[inputNumber - 1];
      id = this.extractId(selected, idKeys);
    } else if (items.length > 0) {
      selected = items.find((item) =>
        nameKeys.some((key) => item[key]?.toLowerCase() === text.toLowerCase())
      );
      id = selected ? this.extractId(selected, idKeys) : null;
    }

    return { selected, id };
  }

  extractId(item, idKeys) {
    for (const key of idKeys) {
      if (item[key]) return item[key];
    }
    return null;
  }
}
