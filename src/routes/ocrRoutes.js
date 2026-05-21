import express from "express";
import ocrController from "../controllers/ocrController.js";
import { authenticate } from "../middlewares/auth.js";
import { ocrLimiter } from "../middlewares/rateLimiter.js";
import { uploadAadhaarImage } from "../middlewares/upload.js";

const router = express.Router();

router.post(
  "/aadhaar/front",
  ocrLimiter,
  authenticate,
  uploadAadhaarImage,
  ocrController.extractAadhaarFront,
);

router.post(
  "/aadhaar/back",
  ocrLimiter,
  authenticate,
  uploadAadhaarImage,
  ocrController.extractAadhaarBack,
);

export default router;
