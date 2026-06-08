import express from "express";
import duplicateReceiptController from "../controllers/duplicateReceiptController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { uploadPaymentProof } from "../middlewares/upload.js";
import { createDuplicateReceiptSchema } from "../validations/duplicateReceiptValidation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("admin", "editor", "employee"),
  duplicateReceiptController.getDuplicateReceipts,
);

router.post(
  "/",
  authorize("admin", "editor", "employee"),
  uploadPaymentProof,
  validate(createDuplicateReceiptSchema),
  duplicateReceiptController.createDuplicateReceipt,
);

router.delete(
  "/:receiptNo",
  authorize("admin", "editor"),
  duplicateReceiptController.deleteDuplicateReceipt,
);

export default router;
