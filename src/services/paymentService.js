import paymentRepository from "../repositories/paymentRepository.js";
import { ApiError } from "../utils/apiResponse.js";

class PaymentService {
  /**
   * Create a new payment
   */
  async createPayment(paymentData) {
    // Check if transaction ID already exists
    const existingPayment = await paymentRepository.findByTransactionId(
      paymentData.transactionId,
    );

    if (existingPayment) {
      throw new ApiError(
        409,
        `Payment with transaction ID ${paymentData.transactionId} already exists`,
      );
    }

    return await paymentRepository.create(paymentData);
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
