export class GlobalPayAPIService {
  constructor() {
    this.client = axios.create({
      baseURL: GLOBALPAY_BASE_URL,
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
    const res = await this.client.post("/api/Payment/initiate", paymentDetails);
    return { success: true, data: res.data };
  }

  async verifyPayment(reference) {
    const res = await this.client.get(`/api/Payment/verify/${reference}`);
    return { success: true, data: res.data };
  }
}
