import ocrService from "../services/ocrService.js";
import { asyncHandler, successResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiResponse.js";

const requireImage = (req) => {
  if (!req.file) {
    throw new ApiError(400, "Image is required. Use form field name: image");
  }
};

const extractAadhaarFront = asyncHandler(async (req, res) => {
  requireImage(req);
  const data = await ocrService.extractFront(req.file);
  successResponse(res, 200, "Aadhaar front extracted successfully", data);
});

const extractAadhaarBack = asyncHandler(async (req, res) => {
  requireImage(req);
  const data = await ocrService.extractBack(req.file);
  successResponse(res, 200, "Aadhaar back extracted successfully", data);
});

export default {
  extractAadhaarFront,
  extractAadhaarBack,
};
