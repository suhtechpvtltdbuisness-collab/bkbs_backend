import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Multer configuration for file uploads
 * Stores files in uploads folder organized by year
 */

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get current year
    const year = new Date().getFullYear();

    // Create path: uploads/YYYY/
    const uploadPath = path.join(process.cwd(), "uploads", year.toString());

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);

    // Sanitize filename (remove special characters)
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
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

/**
 * Middleware for uploading card documents
 * Maximum 5 files
 */
export const uploadCardDocuments = upload.array("documents", 5);

/**
 * Middleware for uploading single file
 */
export const uploadSingleFile = upload.single("document");

/**
 * Helper function to delete files
 */
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};

/**
 * Helper function to get file URL
 */
export const getFileUrl = (req, filePath) => {
  if (!filePath) return null;

  // Convert absolute path to relative URL
  const relativePath = filePath.replace(process.cwd(), "");
  const fileUrl = `${req.protocol}://${req.get("host")}${relativePath.replace(/\\/g, "/")}`;

  return fileUrl;
};

export default {
  uploadCardDocuments,
  uploadSingleFile,
  deleteFile,
  getFileUrl,
};
