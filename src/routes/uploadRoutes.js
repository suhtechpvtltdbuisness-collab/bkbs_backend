import express from "express";
import uploadController from "../controllers/uploadController.js";
import { optionalAuth } from "../middlewares/auth.js";
import { uploadSingleMemory, uploadMultipleMemory } from "../middlewares/upload.js";

const router = express.Router();

// Route for single file upload (key: "file")
router.post(
  "/single",
  optionalAuth,
  uploadSingleMemory,
  uploadController.uploadSingle
);

// Route for multiple file uploads (key: "files")
router.post(
  "/multiple",
  optionalAuth,
  uploadMultipleMemory,
  uploadController.uploadMultiple
);

export default router;
