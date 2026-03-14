import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  getYearUploadDirectory,
  deleteFile as deleteFileUtil,
} from "../utils/fileSystem.js";
import { uploadSingleToVercelBlob } from "../utils/vercelBlob.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Multer configuration for file uploads
 * Uses memory storage for Vercel Blob uploads
 * Falls back to disk storage for local development
 */

// Check if using Vercel Blob storage
const useVercelBlob =
  process.env.BLOB_READ_WRITE_TOKEN &&
  (process.env.VERCEL || process.env.NODE_ENV === "production");

// Storage configuration
const storage = useVercelBlob
  ? multer.memoryStorage() // Use memory storage for Vercel Blob
  : multer.diskStorage({
      // Use disk storage for local development
      destination: (req, file, cb) => {
        const year = new Date().getFullYear();
        const uploadPath = getYearUploadDirectory(year);
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");
        cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
      },
    });

// File filter - accept only specific file types
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX files are allowed.",
      ),
      false,
    );
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB per file
  },
});

/**
 * Middleware for uploading card documents
 * Maximum 5 files
 * Also accepts other form fields
 */
export const uploadCardDocuments = upload.fields([
  { name: "documents", maxCount: 9 },
]);

/**
 * Alternative: Accept any fields (more flexible)
 */
export const uploadAnyFields = upload.any();

/**
 * Middleware for uploading single file
 */
export const uploadSingleFile = upload.single("document");

/**
 * Middleware for uploading a single doctor logo file
 */
export const uploadDoctorLogo = upload.single("logo");

/**
 * Middleware for uploading a single organization logo file
 */
export const uploadOrganizationLogo = upload.single("logo");

/**
 * Attach uploaded logo path to req.body.logo so Joi validation can include it
 */
export const mapUploadedLogoToBody = (blobFolder) => {
  return async (req, res, next) => {
    try {
      if (!req.file) {
        return next();
      }

      if (useVercelBlob) {
        const uploaded = await uploadSingleToVercelBlob(req.file, blobFolder);
        req.body.logo = uploaded.path;
        return next();
      }

      let relativePath = req.file.path;
      if (relativePath.startsWith("/tmp/uploads/")) {
        relativePath = relativePath.replace("/tmp/uploads/", "/uploads/");
      } else if (relativePath.includes("/uploads/")) {
        relativePath = relativePath.substring(
          relativePath.indexOf("/uploads/"),
        );
      }

      req.body.logo = relativePath;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/**
 * Helper function to delete files
 * Re-export from fileSystem utility
 */
export const deleteFile = deleteFileUtil;

/**
 * Helper function to get file URL
 */
export const getFileUrl = (req, filePath) => {
  if (!filePath) return null;

  // In serverless environments, files in /tmp are not accessible via URL
  // This is a limitation - consider using cloud storage (S3, Cloudinary) for production
  if (filePath.startsWith("/tmp")) {
    console.warn(
      "Warning: Files in /tmp directory are not accessible via URL in serverless environments",
    );
    return null;
  }

  // Convert absolute path to relative URL for local development
  const relativePath = filePath.replace(process.cwd(), "");
  const fileUrl = `${req.protocol}://${req.get("host")}${relativePath.replace(/\\/g, "/")}`;

  return fileUrl;
};

export default {
  uploadCardDocuments,
  uploadSingleFile,
  uploadDoctorLogo,
  uploadOrganizationLogo,
  mapUploadedLogoToBody,
  deleteFile,
  getFileUrl,
};
