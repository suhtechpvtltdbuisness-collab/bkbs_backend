import crypto from "crypto";
import User from "../models/User.js";
import Card from "../models/Card.js";

/**
 * ID Generator Utility
 *
 * This module provides functions to generate unique IDs for various entities
 *
 * Usage Examples:
 *
 * // Generate employee ID (e.g., EMP-00001)
 * const employeeId = await generateEmployeeId();
 *
 * // Generate application ID (e.g., AC-0000000001)
 * const applicationId = await generateApplicationId();
 *
 * // Generate application ID with hex (e.g., AC-18A2F3E4-A1B2C3D4)
 * const applicationIdHex = await generateApplicationIdHex();
 *
 * // Generate card number (e.g., CARD-0000000001)
 * const cardNo = await generateCardNumber();
 *
 * // Generate custom unique ID
 * const customId = generateUniqueId("CUSTOM-", 10);
 */

/**
 * Generate a unique employee ID in format: EMP-00001
 */
export const generateEmployeeId = async () => {
  const prefix = "EMP-";
  const padLength = 5;

  // Find the last employee ID
  const lastUser = await User.findOne({
    employeeId: { $exists: true, $ne: null },
  })
    .sort({ createdAt: -1 })
    .select("employeeId");

  let nextNumber = 1;

  if (lastUser && lastUser.employeeId) {
    // Extract number from the last employee ID
    const lastNumber = parseInt(lastUser.employeeId.replace(prefix, ""), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Generate new ID with padding
  const newId = prefix + String(nextNumber).padStart(padLength, "0");

  // Check if ID already exists (safety check)
  const exists = await User.exists({ employeeId: newId });
  if (exists) {
    // If exists, try next number
    return generateEmployeeId();
  }

  return newId;
};

/**
 * Generate a unique application ID in format: AC-0000000001
 */
export const generateApplicationId = async () => {
  const prefix = "AC-";
  const padLength = 10;

  // Find the last application ID
  const lastCard = await Card.findOne({
    applicationId: { $exists: true, $ne: null },
  })
    .sort({ createdAt: -1 })
    .select("applicationId");

  let nextNumber = 1;

  if (lastCard && lastCard.applicationId) {
    // Extract number from the last application ID
    const lastNumber = parseInt(lastCard.applicationId.replace(prefix, ""), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Generate new ID with padding
  const newId = prefix + String(nextNumber).padStart(padLength, "0");

  // Check if ID already exists (safety check)
  const exists = await Card.exists({ applicationId: newId });
  if (exists) {
    // If exists, try next number
    return generateApplicationId();
  }

  return newId;
};

/**
 * Generate a unique application ID with hexadecimal value
 * Format: AC-[timestamp in hex]-[random hex]
 */
export const generateApplicationIdHex = async () => {
  const prefix = "AC-";
  const timestamp = Date.now().toString(16).toUpperCase();
  const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();

  const newId = `${prefix}${timestamp}-${randomHex}`;

  // Check if ID already exists (very unlikely with this method)
  const exists = await Card.exists({ applicationId: newId });
  if (exists) {
    // If exists, try again
    return generateApplicationIdHex();
  }

  return newId;
};

/**
 * Generate a unique card number
 * Format: CARD-[10 digit number]
 */
export const generateCardNumber = async () => {
  const prefix = "CARD-";
  const padLength = 10;

  // Find the last card number
  const lastCard = await Card.findOne({ cardNo: { $exists: true, $ne: null } })
    .sort({ createdAt: -1 })
    .select("cardNo");

  let nextNumber = 1;

  if (lastCard && lastCard.cardNo) {
    // Extract number from the last card number
    const lastNumber = parseInt(lastCard.cardNo.replace(prefix, ""), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Generate new card number with padding
  const newCardNo = prefix + String(nextNumber).padStart(padLength, "0");

  // Check if card number already exists (safety check)
  const exists = await Card.exists({ cardNo: newCardNo });
  if (exists) {
    // If exists, try next number
    return generateCardNumber();
  }

  return newCardNo;
};

/**
 * Generate a random unique ID with prefix
 * @param {string} prefix - Prefix for the ID
 * @param {number} length - Length of random part (default: 8)
 */
export const generateUniqueId = (prefix = "", length = 8) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .toUpperCase()
    .substring(0, length);

  return `${prefix}${timestamp}-${randomPart}`;
};

export default {
  generateEmployeeId,
  generateApplicationId,
  generateApplicationIdHex,
  generateCardNumber,
  generateUniqueId,
};
