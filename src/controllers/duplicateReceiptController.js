import duplicateReceiptService from "../services/duplicateReceiptService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { paginate } from "../utils/helpers.js";
import { storeUploadedImage } from "../utils/vercelBlob.js";

class DuplicateReceiptController {
  async createDuplicateReceipt(req, res, next) {
    try {
      const paymentProofImage = await storeUploadedImage(
        req.file,
        req.body?.paymentProofImage,
        "duplicate-receipts",
      );

      const receipt = await duplicateReceiptService.createDuplicateReceipt(
        req.body,
        paymentProofImage,
        req.user.userId,
      );

      res
        .status(201)
        .json(
          new ApiResponse(201, receipt, "Duplicate receipt created successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  async getDuplicateReceipts(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);

      const result = await duplicateReceiptService.getDuplicateReceipts({
        page,
        limit,
        paymentStatus: req.query.paymentStatus,
        paymentMethod: req.query.paymentMethod,
        search: req.query.search,
      });

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Duplicate receipts retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  async deleteDuplicateReceipt(req, res, next) {
    try {
      const result = await duplicateReceiptService.deleteDuplicateReceipt(
        req.params.receiptNo,
      );

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Duplicate receipt deleted successfully"),
        );
    } catch (error) {
      next(error);
    }
  }
}

export default new DuplicateReceiptController();
