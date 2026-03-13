import { Cashfree } from "cashfree-pg";
import config from "../config/env.js";
import { ApiError } from "../utils/apiResponse.js";

class CashfreeService {
  constructor() {
    Cashfree.XClientId = config.cashfree.appId;
    Cashfree.XClientSecret = config.cashfree.secretKey;
    Cashfree.XEnvironment =
      String(config.cashfree.environment).toUpperCase() === "PRODUCTION"
        ? Cashfree.Environment.PRODUCTION
        : Cashfree.Environment.SANDBOX;

    this.apiVersion = config.cashfree.apiVersion;
  }

  ensureConfigured() {
    if (!config.cashfree.appId || !config.cashfree.secretKey) {
      throw new ApiError(
        500,
        "Cashfree credentials are not configured on the server",
      );
    }
  }

  async createOrder({
    orderId,
    amount,
    customerId,
    customerName,
    customerEmail,
    customerPhone,
  }) {
    this.ensureConfigured();

    const request = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
    };

    const response = await Cashfree.PGCreateOrder(this.apiVersion, request);
    return response.data;
  }

  async fetchOrder(orderId) {
    this.ensureConfigured();

    const response = await Cashfree.PGFetchOrder(this.apiVersion, orderId);
    return response.data;
  }
}

export default new CashfreeService();
