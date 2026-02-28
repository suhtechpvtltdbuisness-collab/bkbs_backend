import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

/**
 * Generate access token
 * @param {Object} payload - Token payload
 * @returns {String} JWT access token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpire,
  });
};

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {String} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpire,
  });
};

/**
 * Verify access token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.accessSecret);
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

/**
 * Verify refresh token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

/**
 * Decode token without verification
 * @param {String} token - JWT token
 * @returns {Object} Decoded token
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Get token expiration time in milliseconds
 * @param {String} expiresIn - Expiration string (e.g., '15m', '7d')
 * @returns {Number} Expiration time in milliseconds
 */
export const getTokenExpiration = (expiresIn) => {
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1));

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || 1000);
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
};
