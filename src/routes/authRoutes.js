import express from "express";
import authController from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import {
  authLimiter,
  createAccountLimiter,
} from "../middlewares/rateLimiter.js";
import validate from "../middlewares/validate.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../validations/authValidation.js";

const router = express.Router();

// Public routes with rate limiting
router.post(
  "/register",
  createAccountLimiter,
  validate(registerSchema),
  authController.register,
);

router.post("/login", authLimiter, validate(loginSchema), authController.login);

router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  authController.refreshToken,
);

// Protected routes
router.post("/logout", authenticate, authController.logout);
router.post("/logout-all", authenticate, authController.logoutAll);
router.get("/me", authenticate, authController.getCurrentUser);

export default router;
