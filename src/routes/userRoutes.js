import express from "express";
import userController from "../controllers/userController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import {
  updateProfileSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from "../validations/userValidation.js";

const router = express.Router();

// User profile routes (authenticated users)
router.get("/profile", authenticate, userController.getProfile);
router.put(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  userController.updateProfile,
);

// Admin routes
router.get("/", authenticate, authorize("admin"), userController.getAllUsers);

router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  userController.getUserById,
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  userController.deleteUser,
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  validate(updateUserStatusSchema),
  userController.updateUserStatus,
);

router.patch(
  "/:id/role",
  authenticate,
  authorize("admin"),
  validate(updateUserRoleSchema),
  userController.updateUserRole,
);

export default router;
