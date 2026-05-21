import rateLimit from "express-rate-limit";
import { config } from "../config/env.js";

/**
 * General rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter (stricter for auth endpoints)
 */
export const authLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 5, // 5 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Create account rate limiter
 */
export const ocrLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number.parseInt(process.env.OCR_RATE_LIMIT_MAX || "20", 10),
  message: {
    success: false,
    message: "Too many OCR requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 accounts per hour
  message: {
    success: false,
    message: "Too many accounts created from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  generalLimiter,
  authLimiter,
  ocrLimiter,
  createAccountLimiter,
};
