import axios from "axios";

const GLOBALPAY_BASE_URL =
  process.env.GLOBALPAY_BASE_URL ||
  "https://tingoaipaymentgateway.tingosuperapp.ai";

export class GlobalPayAPIService {
  constructor() {
    this.headers = {
      "Content-Type": "application/json",
      // Assuming 'Authorization': `Bearer ${GLOBALPAY_API_KEY}` is needed.
      // The provided documentation does not specify authentication, so this might need adjustment.
      // Authorization: `Bearer ${GLOBALPAY_API_KEY}`,
    };
  }

  async apiCall(method, url, data = null) {
    try {
      const config = { headers: this.headers };

      let response;
      if (method === "GET") {
        response = await axios.get(url, config);
      } else if (method === "POST") {
        response = await axios.post(url, data, config);
      }

      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "GlobalPay API Error:",
        error.response?.data || error.message
      );
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Initiates a payment transaction.
   * @param {object} paymentDetails - The payment details.
   * @param {number} paymentDetails.amount - The payment amount.
   * @param {string} paymentDetails.currency - The currency code (e.g., "NGN").
   * @param {string} paymentDetails.customerFirstName - Customer's first name.
   * @param {string} paymentDetails.customerLastName - Customer's last name.
   * @param {string} paymentDetails.customerEmail - Customer's email.
   * @param {string} paymentDetails.customerPhone - Customer's phone number.
   * @param {string} paymentDetails.customerAddress - Customer's address.
   * @param {string} paymentDetails.merchantTransactionReference - Your unique transaction reference.
   * @returns {Promise<{success: boolean, data?: object, error?: any}>}
   */
  async initiatePayment(paymentDetails) {
    return this.apiCall(
      "POST",
      `${GLOBALPAY_BASE_URL}/api/Payment/initiate`,
      paymentDetails
    );
  }

  /**
   * Verifies the status of a transaction.
   * @param {string} reference - The transaction reference.
   * @returns {Promise<{success: boolean, data?: object, error?: any}>}
   */
  async verifyPayment(reference) {
    return this.apiCall(
      "GET",
      `${GLOBALPAY_BASE_URL}/api/Payment/verify/${reference}`
    );
  }
}
