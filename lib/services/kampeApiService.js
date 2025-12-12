import axios from "axios";

const KAMPE_BASE_URL = "https://kampe.hayokmedicare.ng/api";

export class KampeAPIService {
  constructor(bearerToken) {
    this.bearerToken = bearerToken;
    this.headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
    };
  }

  async apiCall(method, url, data = null, loadingMessage = 'Processing...') {
    try {
      const config = { headers: this.headers };
      
      let response;
      if (method === 'GET') {
        response = await axios.get(url, config);
      } else if (method === 'POST') {
        response = await axios.post(url, data, config);
      }
      
      return { success: true, data: response.data, loadingMessage };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message, loadingMessage };
    }
  }

  // Get all providers
  async getProviders() {
    return this.apiCall('GET', `${KAMPE_BASE_URL}/v1/providers`, null, 'Loading healthcare providers');
  }

  // Get all health insurance plans
  async getHealthPlans() {
    return this.apiCall('GET', `${KAMPE_BASE_URL}/v1/plans/`, null, 'Loading insurance plans');
  }

  // Get plan details
  async getPlanDetails(planId) {
    try {
      const response = await axios.get(
        `${KAMPE_BASE_URL}/v1/health/plans/${planId}`,
        { headers: this.headers }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Kampe - Get Plan Details Error:", error.response?.data);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // Get list of states
  async getStates() {
    return this.apiCall('GET', `${KAMPE_BASE_URL}/v1/auth/states`, null, 'Loading states');
  }

  // Get LGAs for a state
  async getLGAs(stateId) {
    return this.apiCall('GET', `${KAMPE_BASE_URL}/v1/auth/lga/${stateId}`, null, 'Loading local governments');
  }

  // Get hospitals in LGA
  async getHospitals(lgaId) {
    try {
      const response = await axios.get(
        `${KAMPE_BASE_URL}/v1/hospitals/lga/${lgaId}`,
        { headers: this.headers }
      );
      console.log("Kampe - Hospitals:", JSON.stringify(response.data, null, 2));
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Kampe - Get Hospitals Error:", error.response?.data);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // Create enrollment/subscription
  async createEnrollment(enrollmentData) {
    return this.apiCall('POST', `${KAMPE_BASE_URL}/v1/auth/register`, enrollmentData, 'Processing registration');
  }

  // Generate invoice
  async generateInvoice(enrollmentId) {
    try {
      const response = await axios.post(
        `${KAMPE_BASE_URL}/v1/invoices/generate`,
        { enrollment_id: enrollmentId },
        { headers: this.headers }
      );
      console.log(
        "Kampe - Invoice Generated:",
        JSON.stringify(response.data, null, 2)
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Kampe - Generate Invoice Error:", error.response?.data);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // Verify payment
  async verifyPayment(paymentReference) {
    try {
      const response = await axios.get(
        `${KAMPE_BASE_URL}/v1/payments/verify/${paymentReference}`,
        { headers: this.headers }
      );
      console.log(
        "Kampe - Payment Verified:",
        JSON.stringify(response.data, null, 2)
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Kampe - Verify Payment Error:", error.response?.data);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // Get policy details
  async getPolicyDetails(policyNumber) {
    try {
      const response = await axios.get(
        `${KAMPE_BASE_URL}/v1/policies/${policyNumber}`,
        { headers: this.headers }
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Kampe - Get Policy Error:", error.response?.data);
      return { success: false, error: error.response?.data || error.message };
    }
  }
}
