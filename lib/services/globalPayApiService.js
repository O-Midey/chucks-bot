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
      const res = await this.client.post(
        "/api/Payment/initiate",
        paymentDetails
      );
      return { success: true, data: res.data };
    } catch (error) {
      console.error(
        "Payment initiate error:",
        error.response?.data || error.message
      );
      return { success: false, error: error.response?.data || error.message };
    }
  }

  async verifyPayment(reference) {
    try {
      const res = await this.client.get(`/api/Payment/verify/${reference}`);
      return { success: true, data: res.data };
    } catch (error) {
      console.error(
        "Payment verification error:",
        error.response?.data || error.message
      );
      return { success: false, error: error.response?.data || error.message };
    }
  }
}
