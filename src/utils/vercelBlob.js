import { put } from "@vercel/blob";
import path from "path";

/**
 * Vercel Blob Storage Upload Handler
 * Handles file uploads to Vercel Blob storage
 */

/**
 * Upload files to Vercel Blob storage
 * @param {Array} files - Array of files from multer (req.files)
 * @returns {Promise<Array>} - Array of uploaded file metadata with URLs
 */
export const uploadToVercelBlob = async (files) => {
  try {
    const uploadPromises = files.map(async (file) => {
      // Generate path: year/sanitized-filename
      const year = new Date().getFullYear();
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const blobPath = `${year}/${sanitizedName}-${uniqueSuffix}${ext}`;

      // Upload to Vercel Blob
      const blob = await put(blobPath, file.buffer, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return {
        filename: `${sanitizedName}-${uniqueSuffix}${ext}`,
        originalName: file.originalname,
        path: blob.url, // Vercel Blob URL
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date(),
      };
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    throw new Error("Failed to upload files to cloud storage");
  }
};

/**
 * Upload single file to Vercel Blob storage
 * @param {Object} file - Single file from multer (req.file)
 * @returns {Promise<Object>} - Uploaded file metadata with URL
 */
export const uploadSingleToVercelBlob = async (file) => {
  const result = await uploadToVercelBlob([file]);
  return result[0];
};

export default {
  uploadToVercelBlob,
  uploadSingleToVercelBlob,
};
