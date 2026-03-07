import fs from "fs";
import path from "path";

/**
 * Middleware to check if uploaded files still exist
 * This is important in serverless environments where /tmp files are ephemeral
 */
export const checkFileExists = (req, res, next) => {
  const filePath = req.path;

  // Check if this is an uploads request
  if (!filePath.startsWith("/uploads/")) {
    return next();
  }

  // Construct full file path
  let fullPath;

  // Check in /tmp/uploads first (serverless)
  const tmpPath = path.join("/tmp", filePath);
  if (fs.existsSync(tmpPath)) {
    req.filePath = tmpPath;
    return next();
  }

  // Check in local uploads (development)
  const localPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(localPath)) {
    req.filePath = localPath;
    return next();
  }

  // File not found - might have been deleted in serverless environment
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return res.status(410).json({
      success: false,
      message:
        "File no longer available. Files uploaded to serverless environments are temporary and may be deleted after function execution. Please use cloud storage (AWS S3, Cloudinary) for production.",
      code: "FILE_EXPIRED",
    });
  }

  // Let express.static handle the 404
  next();
};

export default checkFileExists;
