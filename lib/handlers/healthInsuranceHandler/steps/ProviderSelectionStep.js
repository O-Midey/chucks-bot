import { BaseStep } from "./BaseStep.js";
import { STATES } from "../../../config/constants.js";
import { KampeAPIService } from "../../../services/kampeApiService.js";
import { LoadingWrapper } from "../../../utils/loadingWrapper.js";
import { HealthInsuranceFormatter } from "../formatters/HealthInsuranceFormatter.js";
import { SessionManager } from "../../../session/sessionManager.js";
import { cacheService } from "../../../services/cacheService.js";

const kampeAPI = new KampeAPIService(process.env.KAMPE_BEARER_TOKEN);

export class ProviderSelectionStep extends BaseStep {
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

  async loadAndShowProviders() {
    return LoadingWrapper.callWithLoading(
      this.userId,
      "Loading healthcare providers...",
      async () => {
        const session = await SessionManager.getSession(this.userId);
        const userLgaId = session.data.lgaId;

        // Try cache first
        let validProviders = await cacheService.getProviders();

        // If cache contains a very small provider list (likely from local tests/mocks), treat as a miss
        if (
          Array.isArray(validProviders) &&
          validProviders.length > 0 &&
          validProviders.length < 5
        ) {
          console.warn(
            `kampe:providers cache contains only ${validProviders.length} entries - treating as stale and refetching`
          );
          validProviders = null;
        }

        if (!validProviders) {
          // Cache miss - fetch from API
          const providersResult = await kampeAPI.getProviders();

          if (!providersResult.success || !providersResult.data) {
            await SessionManager.updateSession(this.userId, STATES.MAIN_MENU);
            return this.createResponse(
              `Sorry, we're having trouble loading providers. Please try again later or type MENU to return.`,
              STATES.MAIN_MENU
            );
          }

          validProviders = this.extractValidProviders(providersResult.data);

          // Cache the result
          await cacheService.setProviders(validProviders);
        }

        const lgaProviders = validProviders.filter(
          (p) => p.localgovt?.id == userLgaId
        );
        const otherProviders = validProviders.filter(
          (p) => p.localgovt?.id != userLgaId
        );

        return this.formatProviderMessage(
          lgaProviders,
          otherProviders,
          session
        );
      }
    );
  }

  async handleProviderSelection(input, text) {
    const session = await SessionManager.getSession(this.userId);
    const lgaProviders = session.data.lgaProviders || [];
    const otherProviders = session.data.otherProviders || [];
    const availableProviders = session.data.availableProviders || [];
    const showingLgaProviders = session.data.showingLgaProviders;
    const allOtherProviders = session.data.allOtherProviders || [];

    // Handle commands
    if (input === "change lga" || input === "change" || input === "lga") {
      return this.handleChangeLGA();
    }

    if (input === "all") {
      const message =
        HealthInsuranceFormatter.formatProviderList(allOtherProviders);
      this.updateSession(STATES.HEALTH_PROVIDER_SELECT, {
        availableProviders: allOtherProviders,
        showingLgaProviders: false,
      });
      return this.createResponse(message, STATES.HEALTH_PROVIDER_SELECT);
    }

    // Handle search by name
    if (isNaN(parseInt(input))) {
      return this.handleProviderSearch(
        text,
        lgaProviders,
        otherProviders,
        allOtherProviders
      );
    }

    // Handle number selection
    return await this.handleProviderNumberSelection(
      parseInt(input),
      lgaProviders,
      otherProviders,
      availableProviders,
      showingLgaProviders
    );
  }

  handleChangeLGA() {
    // Converted to async to allow dynamic import and safe await
    // NOTE: callers expect a Promise if they await this; handleProviderSelection is async so that's fine
  }

  async handleChangeLGA() {
    const session = await SessionManager.getSession(this.userId);
    const stateId = session.data.stateId;

    if (stateId) {
      const module = await import("./LocationStep.js");
      const LocationStep = module.LocationStep;
      return await new LocationStep(this.userId).fetchAndShowLGAs(stateId);
    }

    await SessionManager.updateSession(this.userId, STATES.HEALTH_REG_LGA);
    return this.createResponse(
      `What is your *Local Government Area (LGA)*?\n\n_Please type your LGA name_`,
      STATES.HEALTH_REG_LGA
    );
  }

  handleProviderSearch(text, lgaProviders, otherProviders, allOtherProviders) {
    const allProviders = [
      ...lgaProviders,
      ...otherProviders,
      ...allOtherProviders,
    ];
    const searchResults = allProviders.filter((provider) =>
      provider.agency_name.toLowerCase().includes(text.toLowerCase())
    );

    if (searchResults.length === 0) {
      return this.createResponse(
        `No healthcare providers found matching "${text}".\n\n🏥 *Please select a healthcare provider from the numbered list above.*\n\nYou can:\n• Reply with a number (e.g., 1, 2, 3)\n• Type a provider name to search\n• Type "CHANGE LGA" to select a different area\n• Type "ALL" to see all providers`,
        STATES.HEALTH_PROVIDER_SELECT
      );
    }

    const message = HealthInsuranceFormatter.formatProviderList(searchResults);
    this.updateSession(STATES.HEALTH_PROVIDER_SELECT, {
      availableProviders: searchResults,
      showingLgaProviders: false,
    });
    return this.createResponse(message, STATES.HEALTH_PROVIDER_SELECT);
  }

  async handleProviderNumberSelection(
    providerNumber,
    lgaProviders,
    otherProviders,
    availableProviders,
    showingLgaProviders
  ) {
    if (showingLgaProviders) {
      if (providerNumber >= 1 && providerNumber <= lgaProviders.length) {
        return await this.selectProvider(lgaProviders[providerNumber - 1]);
      }
      if (
        providerNumber === lgaProviders.length + 1 &&
        otherProviders.length > 0
      ) {
        const message = HealthInsuranceFormatter.formatProviderList(
          otherProviders.slice(0, 10)
        );
        this.updateSession(STATES.HEALTH_PROVIDER_SELECT, {
          availableProviders: otherProviders.slice(0, 10),
          showingLgaProviders: false,
        });
        return this.createResponse(message, STATES.HEALTH_PROVIDER_SELECT);
      }
    } else {
      if (providerNumber >= 1 && providerNumber <= availableProviders.length) {
        return await this.selectProvider(
          availableProviders[providerNumber - 1]
        );
      }
    }

    const maxNumber = showingLgaProviders
      ? lgaProviders.length + (otherProviders.length > 0 ? 1 : 0)
      : availableProviders.length;

    return this.createResponse(
      `Please select a valid number (1-${maxNumber}) or search by provider name.`,
      STATES.HEALTH_PROVIDER_SELECT
    );
  }

  async selectProvider(provider) {
    this.updateSession(STATES.HEALTH_REVIEW, {
      selectedProvider: provider,
      providerId: provider.id,
      providerName: provider.agency_name.trim(),
    });

    const ReviewStep = (await import("./ReviewStep.js")).default;
    return new ReviewStep(this.userId).showReviewSummary();
  }

  extractValidProviders(data) {
    let providersArray = [];
    if (Array.isArray(data)) {
      providersArray = data;
    } else if (data.providers) {
      providersArray = data.providers;
    } else if (data.data) {
      providersArray = data.data;
    }

    return providersArray.filter((provider) => {
      const name = (provider.agency_name || "").trim();
      return name && name.length > 2;
    });
  }

  formatProviderMessage(lgaProviders, otherProviders, session) {
    let message = `🏥 *Select Your Healthcare Provider*\n\n`;

    if (lgaProviders.length > 0) {
      message += `*Providers in your area (${
        session.data.lga || "your location"
      }):*\n\n`;

      lgaProviders.forEach((provider, index) => {
        const providerName = provider.agency_name.trim();
        message += `${this.formatNumberEmoji(index + 1)} ${providerName}\n`;
      });

      if (otherProviders.length > 0) {
        message += `\n*Other providers:*\n`;
        message += `${this.formatNumberEmoji(
          lgaProviders.length + 1
        )} See all other providers\n`;
      }

      message += `\n_Reply with a number (1-${lgaProviders.length}) to select a provider._`;
      message += `\n_Type "CHANGE LGA" to select a different area._`;
      message += `\n_Or type a provider name to search (e.g., "General Hospital")._`;
      message += `\n\n📝 *Please select a healthcare provider, not your address.*`;

      this.updateSession(STATES.HEALTH_PROVIDER_SELECT, {
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
        message += `${this.formatNumberEmoji(
          index + 1
        )} ${providerName}${location}\n`;
      });

      if (otherProviders.length > 10) {
        message += `\n_Showing first 10. Type "ALL" to see all providers._`;
      }

      message += `\n_Reply with a number (1-${displayProviders.length}) to select a provider._`;
      message += `\n_Type "CHANGE LGA" to select a different area._`;
      message += `\n\n📝 *Note: Please select a healthcare provider from the list above.*`;

      this.updateSession(STATES.HEALTH_PROVIDER_SELECT, {
        availableProviders: displayProviders,
        allOtherProviders: otherProviders,
        showingLgaProviders: false,
      });
    }

    return this.createResponse(message, STATES.HEALTH_PROVIDER_SELECT);
  }
}
