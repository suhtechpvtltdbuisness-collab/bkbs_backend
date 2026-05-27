import { uploadSingleToVercelBlob, uploadToVercelBlob } from "../utils/vercelBlob.js";
import { ApiResponse, ApiError } from "../utils/apiResponse.js";

class UploadController {
  /**
   * Upload a single file
   */
  async uploadSingle(req, res, next) {
    try {
      if (!req.file) {
        throw new ApiError(400, "Please upload a file");
      }

      const folder = req.query.folder || "general";
      const uploadedFile = await uploadSingleToVercelBlob(req.file, folder);

      // Construct a response structure similar to what the user requested
      const responseData = {
        user: req.user ? req.user.userId : null,
        key: uploadedFile.filename,
        originalName: uploadedFile.originalName,
        mimetype: uploadedFile.mimetype,
        size: uploadedFile.size,
        path: uploadedFile.path, // This is the relative URL /uploads/...
        createdAt: uploadedFile.uploadedAt,
      };

      res.status(200).json(
        new ApiResponse(200, responseData, "File uploaded successfully")
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        throw new ApiError(400, "Please upload at least one file");
      }

      const folder = req.query.folder || "general";
      const uploadedFiles = await uploadToVercelBlob(req.files, folder);

      const responseData = uploadedFiles.map((file) => ({
        user: req.user ? req.user.userId : null,
        key: file.filename,
        originalName: file.originalName,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        createdAt: file.uploadedAt,
      }));

      res.status(200).json(
        new ApiResponse(200, responseData, "Files uploaded successfully")
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();
