import express from "express";
import ocrController from "../controllers/ocrController.js";
import { ocrLimiter } from "../middlewares/rateLimiter.js";
import { uploadAadhaarImage } from "../middlewares/upload.js";

const router = express.Router();

router.post(
  "/aadhaar/front",
  ocrLimiter,
  uploadAadhaarImage,
  ocrController.extractAadhaarFront,
);

router.post(
  "/aadhaar/back",
  ocrLimiter,
  uploadAadhaarImage,
  ocrController.extractAadhaarBack,
);

export default router;
