import express from "express";
import userController from "../controllers/userController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import {
  updateProfileSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  createUserSchema,
  updateEmployeeSchema,
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

// Create new user (employee or editor) - Admin only
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createUserSchema),
  userController.createUser,
);

// Admin routes
router.get("/", authenticate, authorize("admin"), userController.getAllUsers);

router.get("/:id", authenticate, userController.getUserById);

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

// Update employee details (Admin only)
router.put(
  "/employee/:userId",
  authenticate,
  authorize("admin"),
  validate(updateEmployeeSchema),
  userController.updateEmployee,
);

export default router;
