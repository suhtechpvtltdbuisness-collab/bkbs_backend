import Payment from "../models/Payment.js";

class PaymentRepository {
  /**
   * Create a new payment
   */
  async create(paymentData) {
    return await Payment.create(paymentData);
  }

  /**
   * Find payment by ID
   */
  async findById(id) {
    return await Payment.findById(id).populate("cardId createdBy");
  }

  /**
   * Find payment by transaction ID
   */
  async findByTransactionId(transactionId) {
    return await Payment.findOne({ transactionId }).populate(
      "cardId createdBy",
    );
  }

  /**
   * Find payment by order ID
   */
  async findByOrderId(orderId) {
    return await Payment.findOne({ orderId }).populate("cardId createdBy");
  }

  /**
   * Find all payments by card ID
   */
  async findByCardId(cardId) {
    return await Payment.find({ cardId })
      .populate("createdBy")
      .sort({ createdAt: -1 });
  }

  /**
   * Find all payments with filters and pagination
   */
  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const query = Payment.find(filters)
      .populate("cardId createdBy")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const [payments, total] = await Promise.all([
      query,
      Payment.countDocuments(filters),
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update payment status
   */
  async updateStatus(id, status) {
    return await Payment.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );
  }

  /**
   * Update payment by order ID
   */
  async updateByOrderId(orderId, updateData) {
    return await Payment.findOneAndUpdate({ orderId }, updateData, {
      new: true,
      runValidators: true,
    }).populate("cardId createdBy");
  }

  /**
   * Delete payment
   */
  async delete(id) {
    return await Payment.findByIdAndDelete(id);
  }
}

export default new PaymentRepository();
