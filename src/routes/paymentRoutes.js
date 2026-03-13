import express from "express";
import paymentController from "../controllers/paymentController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createCashfreeOrderValidation,
  updatePaymentStatusValidation,
} from "../validations/paymentValidation.js";

const router = express.Router();

/**
 * POST /api/payments/create-order
 * Create Cashfree order and store pending payment
 * Access: public
 */
router.post(
  "/create-order",
  validate(createCashfreeOrderValidation),
  paymentController.createOrder,
);

/**
 * GET /api/payments/verify/:orderId
 * Verify Cashfree order status
 * Access: public
 */
router.get("/verify/:orderId", paymentController.verifyOrder);

// All routes below require authentication
router.use(authenticate);

/**
 * GET /api/payments
 * Get all payments with filters
 * Access: admin, employee, editor
 */
router.get(
  "/",
  authorize(["admin", "employee", "editor"]),
  paymentController.getAllPayments,
);

/**
 * GET /api/payments/transaction/:transactionId
 * Get payment by transaction ID
 * Access: admin, employee, editor
 */
router.get(
  "/transaction/:transactionId",
  authorize(["admin", "employee", "editor"]),
  paymentController.getPaymentByTransactionId,
);

/**
 * GET /api/payments/card/:cardId
 * Get all payments for a specific card
 * Access: admin, employee, editor
 */
router.get(
  "/card/:cardId",
  authorize(["admin", "employee", "editor"]),
  paymentController.getPaymentsByCardId,
);

/**
 * GET /api/payments/:id
 * Get payment by ID
 * Access: admin, employee, editor
 */
router.get(
  "/:id",
  authorize(["admin", "employee", "editor"]),
  paymentController.getPaymentById,
);

/**
 * PATCH /api/payments/:id/status
 * Update payment status
 * Access: admin, employee, editor
 */
router.patch(
  "/:id/status",
  authorize(["admin", "employee", "editor"]),
  validate(updatePaymentStatusValidation),
  paymentController.updatePaymentStatus,
);

/**
 * DELETE /api/payments/:id
 * Delete payment
 * Access: admin only
 */
router.delete("/:id", authorize(["admin"]), paymentController.deletePayment);

export default router;
