import axios from "axios";

export class GlobalPayAPIService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.GLOBALPAY_BASE_URL,
      auth: {
        username: process.env.PAYMENT_BASIC_AUTH_USERNAME,
        password: process.env.PAYMENT_BASIC_AUTH_PASSWORD,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async initiatePayment(paymentDetails) {
    try {
      console.log("🔄 Initiating payment with GlobalPay...");
      console.log("Base URL:", this.client.defaults.baseURL);
      console.log("Payment details:", { ...paymentDetails, customerEmail: "[REDACTED]" });

      const res = await this.client.post(
        "/api/Payment/initiate",
        paymentDetails
      );

      console.log("✅ Payment initiation successful");
      console.log("📊 Initiation response:", JSON.stringify(res.data, null, 2));
      return { success: true, data: res.data };
    } catch (error) {
      console.error("❌ Payment initiate error:");
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("Message:", error.message);

      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
    }
  }

  async verifyPayment(reference) {
    try {
      console.log(`🔍 Verifying payment for reference: ${reference}`);
      const res = await this.client.get(`/api/Payment/verify/${reference}`);

      console.log("✅ Payment verification API response:", JSON.stringify(res.data, null, 2));
      return { success: true, data: res.data };
    } catch (error) {
      console.error("❌ Payment verification error:");
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("Message:", error.message);

      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status
      };
    }
  }
}
