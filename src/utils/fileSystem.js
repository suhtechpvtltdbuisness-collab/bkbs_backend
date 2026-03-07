import fs from "fs";
import path from "path";

/**
 * File System Utilities
 * Handles directory creation and file operations
 * Works in both local and serverless environments
 */

/**
 * Ensures a directory exists, creates it if it doesn't
 * @param {string} dirPath - The directory path to create
 * @returns {boolean} - True if directory exists or was created successfully
 */
export const ensureDirectoryExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✓ Created directory: ${dirPath}`);
    }
    return true;
  } catch (error) {
    console.error(`✗ Failed to create directory: ${dirPath}`, error);
    return false;
  }
};

/**
 * Get the appropriate upload directory based on environment
 * In serverless environments (Vercel, Lambda), use /tmp
 * In local development, use ./uploads
 * @returns {string} - The base upload directory path
 */
export const getUploadDirectory = () => {
  // Check if running in serverless environment
  const isServerless =
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.FUNCTION_NAME;

  if (isServerless) {
    // Use /tmp directory in serverless environments
    const tmpDir = "/tmp/uploads";
    ensureDirectoryExists(tmpDir);
    return tmpDir;
  } else {
    // Use local uploads directory in development/traditional hosting
    const localDir = path.join(process.cwd(), "uploads");
    ensureDirectoryExists(localDir);
    return localDir;
  }
};

/**
 * Get upload directory for a specific year
 * @param {number} year - The year (e.g., 2026)
 * @returns {string} - The year-specific upload directory path
 */
export const getYearUploadDirectory = (year) => {
  const baseDir = getUploadDirectory();
  const yearDir = path.join(baseDir, year.toString());
  ensureDirectoryExists(yearDir);
  return yearDir;
};

/**
 * Check if file exists
 * @param {string} filePath - The file path to check
 * @returns {boolean} - True if file exists
 */
export const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

/**
 * Delete a file safely
 * @param {string} filePath - The file path to delete
 * @returns {boolean} - True if deleted successfully
 */
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✓ Deleted file: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Failed to delete file: ${filePath}`, error);
    return false;
  }
};

/**
 * Get file size in bytes
 * @param {string} filePath - The file path
 * @returns {number|null} - File size in bytes or null if error
 */
export const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`✗ Failed to get file size: ${filePath}`, error);
    return null;
  }
};

export default {
  ensureDirectoryExists,
  getUploadDirectory,
  getYearUploadDirectory,
  fileExists,
  deleteFile,
  getFileSize,
};
