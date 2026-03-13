import paymentRepository from "../repositories/paymentRepository.js";
import { ApiError } from "../utils/apiResponse.js";
import cashfreeService from "./cashfreeService.js";

class PaymentService {
  /**
   * Create a new payment
   */
  async createPayment(paymentData) {
    // Check if transaction ID already exists
    if (paymentData.transactionId) {
      const existingPayment = await paymentRepository.findByTransactionId(
        paymentData.transactionId,
      );

      if (existingPayment) {
        throw new ApiError(
          409,
          `Payment with transaction ID ${paymentData.transactionId} already exists`,
        );
      }
    }

    return await paymentRepository.create(paymentData);
  }

  /**
   * Create a Cashfree order and persist a pending payment record
   */
  async createCashfreeOrder(orderData) {
    const orderId = `order_${Date.now()}`;

    const gatewayOrder = await cashfreeService.createOrder({
      orderId,
      amount: orderData.amount,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
    });

    const payment = await this.createPayment({
      orderId,
      transactionId: gatewayOrder.cf_order_id,
      cardId: orderData.cardId,
      createdBy: orderData.createdBy,
      amount: orderData.amount,
      paymentMethod: orderData.paymentMethod || "online",
      status: "PENDING",
    });

    return {
      payment,
      orderId,
      paymentSessionId: gatewayOrder.payment_session_id,
      gatewayOrder,
    };
  }

  /**
   * Verify Cashfree order and sync stored payment status
   */
  async verifyCashfreeOrder(orderId) {
    const payment = await paymentRepository.findByOrderId(orderId);

    if (!payment) {
      throw new ApiError(404, "Payment order not found");
    }

    const gatewayOrder = await cashfreeService.fetchOrder(orderId);
    const status = this.mapCashfreeStatus(gatewayOrder.order_status);
    const transactionId =
      gatewayOrder.cf_order_id || payment.transactionId || undefined;

    const updatedPayment = await paymentRepository.updateByOrderId(orderId, {
      status,
      transactionId,
      paymentMethod: payment.paymentMethod || "online",
    });

    return {
      payment: updatedPayment,
      gatewayOrder,
    };
  }

  mapCashfreeStatus(orderStatus) {
    switch (orderStatus) {
      case "PAID":
        return "SUCCESS";
      case "EXPIRED":
      case "TERMINATED":
      case "TERMINATION_REQUESTED":
        return "FAILED";
      default:
        return "PENDING";
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id) {
    const payment = await paymentRepository.findById(id);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    return payment;
  }

  /**
   * Get payment by transaction ID
   */
  async getPaymentByTransactionId(transactionId) {
    const payment = await paymentRepository.findByTransactionId(transactionId);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    return payment;
  }

  /**
   * Get all payments for a card
   */
  async getPaymentsByCardId(cardId) {
    return await paymentRepository.findByCardId(cardId);
  }

  /**
   * Get all payments with filters
   */
  async getAllPayments(filters = {}, options = {}) {
    return await paymentRepository.findAll(filters, options);
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(id, status) {
    const payment = await paymentRepository.findById(id);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    return await paymentRepository.updateStatus(id, status);
  }

  /**
   * Delete payment
   */
  async deletePayment(id) {
    const payment = await paymentRepository.findById(id);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    return await paymentRepository.delete(id);
  }
}

export default new PaymentService();
