import express from "express";
import organizationController from "../controllers/organizationController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import {
  uploadOrganizationLogo,
  mapUploadedLogoToBody,
} from "../middlewares/upload.js";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from "../validations/organizationValidation.js";

const router = express.Router();

// Create organization (Admin/Employee)
router.post(
  "/",
  authenticate,
  authorize("admin", "employee"),
  uploadOrganizationLogo,
  mapUploadedLogoToBody("organizations/logos"),
  validate(createOrganizationSchema),
  organizationController.createOrganization,
);

// Get all organizations (All authenticated users)
router.get("/", authenticate, organizationController.getAllOrganizations);

// Dashboard stats (Admin only)
router.get(
  "/dashboard/stats",
  authenticate,
  authorize("admin"),
  organizationController.getDashboardStats,
);

// Get organization by ID (All authenticated users)
router.get("/:id", authenticate, organizationController.getOrganizationById);

// Update organization (Admin/Employee)
router.put(
  "/:id",
  authenticate,
  authorize("admin", "employee"),
  uploadOrganizationLogo,
  mapUploadedLogoToBody("organizations/logos"),
  validate(updateOrganizationSchema),
  organizationController.updateOrganization,
);

// Delete organization (Admin only)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  organizationController.deleteOrganization,
);

export default router;
