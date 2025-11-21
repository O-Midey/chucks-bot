import axios from "axios";
import { BASE_URL } from "../config/constants.js";

export class WhatsAppService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async sendMessage(to, message) {
    if (!this.apiKey) {
      throw new Error("API key not configured");
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/messages`,
        {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        },
        {
          headers: {
            "D360-API-KEY": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
      };
    } catch (error) {
      console.error("WhatsApp API Error:", error.response?.data);
      throw error;
    }
  }
}
