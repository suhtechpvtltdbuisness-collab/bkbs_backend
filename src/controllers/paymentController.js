import paymentService from "../services/paymentService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { paginate } from "../utils/helpers.js";

class PaymentController {
  /**
   * Get payment by ID
   */
  async getPaymentById(req, res, next) {
    try {
      const payment = await paymentService.getPaymentById(req.params.id);

      res
        .status(200)
        .json(new ApiResponse(200, payment, "Payment retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment by transaction ID
   */
  async getPaymentByTransactionId(req, res, next) {
    try {
      const payment = await paymentService.getPaymentByTransactionId(
        req.params.transactionId,
      );

      res
        .status(200)
        .json(new ApiResponse(200, payment, "Payment retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all payments for a specific card
   */
  async getPaymentsByCardId(req, res, next) {
    try {
      const payments = await paymentService.getPaymentsByCardId(
        req.params.cardId,
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            payments,
            "Card payments retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all payments with filters
   */
  async getAllPayments(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const filters = {};

      // Apply filters
      if (req.query.status !== undefined) {
        filters.status = req.query.status === "true";
      }

      if (req.query.method) {
        filters.method = req.query.method;
      }

      if (req.query.cardId) {
        filters.cardId = req.query.cardId;
      }

      const result = await paymentService.getAllPayments(filters, {
        page,
        limit,
      });

      res
        .status(200)
        .json(new ApiResponse(200, result, "Payments retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(req, res, next) {
    try {
      const payment = await paymentService.updatePaymentStatus(
        req.params.id,
        req.body.status,
      );

      res
        .status(200)
        .json(
          new ApiResponse(200, payment, "Payment status updated successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete payment (admin only)
   */
  async deletePayment(req, res, next) {
    try {
      await paymentService.deletePayment(req.params.id);

      res
        .status(200)
        .json(new ApiResponse(200, null, "Payment deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
