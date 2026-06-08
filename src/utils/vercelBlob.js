import fs from "fs/promises";
import path from "path";

/**
 * File Storage Upload Handler (for Railway/Local Storage)
 * Handles file uploads to disk instead of Vercel Blob
 */

/**
 * Upload files to local storage
 * @param {Array} files - Array of files from multer (req.files)
 * @param {string} folder - Optional folder path prefix
 * @returns {Promise<Array>} - Array of uploaded file metadata with URLs
 */
export const uploadToVercelBlob = async (files, folder = "") => {
  try {
    const uploadPromises = files.map(async (file) => {
      // Generate path: year/sanitized-filename
      const year = new Date().getFullYear();
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      
      const fileName = `${sanitizedName}-${uniqueSuffix}${ext}`;
      
      const normalizedFolder = String(folder || "")
        .replace(/^\/+|\/+$/g, "")
        .replace(/\/{2,}/g, "/");

      // Determine base upload directory (Railway volume or local uploads folder)
      const baseDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
      
      // Determine target directory
      const targetDir = normalizedFolder
        ? path.join(baseDir, normalizedFolder, year.toString())
        : path.join(baseDir, year.toString());

      // Ensure directory exists
      await fs.mkdir(targetDir, { recursive: true });

      const filePath = path.join(targetDir, fileName);

      // Write file to disk
      await fs.writeFile(filePath, file.buffer);

      // Generate relative path for URL
      let relativePath = filePath;
      if (relativePath.includes("/uploads/")) {
        relativePath = relativePath.substring(relativePath.indexOf("/uploads/"));
      } else {
        // Fallback for relative path construction
        const urlFolder = normalizedFolder ? `${normalizedFolder}/` : "";
        relativePath = `/uploads/${urlFolder}${year}/${fileName}`;
      }

      return {
        filename: fileName,
        originalName: file.originalname,
        path: relativePath.replace(/\\/g, "/"), // Ensure forward slashes for URLs
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
      };
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error saving files locally:", error);
    throw new Error("Failed to upload files to storage");
  }
};

/**
 * Upload single file to local storage
 * @param {Object} file - Single file from multer (req.file)
 * @param {string} folder - Optional folder path prefix
 * @returns {Promise<Object>} - Uploaded file metadata with URL
 */
export const uploadSingleToVercelBlob = async (file, folder = "") => {
  const result = await uploadToVercelBlob([file], folder);
  return result[0];
};

/**
 * Resolve an uploaded image to a stored relative path.
 * Handles multer memory storage, multer disk storage, and base64 string fallback.
 * @param {Object} file - req.file from multer (optional)
 * @param {string} base64 - base64 image string from JSON body (optional)
 * @param {string} folder - target folder prefix
 * @returns {Promise<string|null>} stored relative path or null
 */
export const storeUploadedImage = async (file, base64, folder = "") => {
  if (file && file.buffer) {
    const result = await uploadSingleToVercelBlob(file, folder);
    return result.path;
  }

  if (file && file.path) {
    let relativePath = file.path;
    if (relativePath.startsWith("/tmp/uploads/")) {
      relativePath = relativePath.replace("/tmp/uploads/", "/uploads/");
    } else if (relativePath.includes("/uploads/")) {
      relativePath = relativePath.substring(relativePath.indexOf("/uploads/"));
    }
    return relativePath.replace(/\\/g, "/");
  }

  if (base64 && typeof base64 === "string") {
    const match = base64.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
    const mimetype = match ? match[1] : "image/jpeg";
    const data = match ? match[2] : base64;
    const buffer = Buffer.from(data, "base64");
    const ext = (mimetype.split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "");
    const result = await uploadSingleToVercelBlob(
      {
        buffer,
        originalname: `image.${ext}`,
        size: buffer.length,
        mimetype,
      },
      folder,
    );
    return result.path;
  }

  return null;
};

export default {
  uploadToVercelBlob,
  uploadSingleToVercelBlob,
  storeUploadedImage,
};
