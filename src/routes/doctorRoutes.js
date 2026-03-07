import express from "express";
import doctorController from "../controllers/doctorController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import {
  createDoctorSchema,
  updateDoctorSchema,
} from "../validations/doctorValidation.js";

const router = express.Router();

// Create doctor (Admin/Employee)
router.post(
  "/",
  authenticate,
  authorize("admin", "employee"),
  validate(createDoctorSchema),
  doctorController.createDoctor,
);

// Get all doctors (All authenticated users)
router.get("/", authenticate, doctorController.getAllDoctors);

// Get doctors by organization (All authenticated users)
router.get(
  "/organization/:organizationId",
  authenticate,
  doctorController.getDoctorsByOrganization,
);

// Get doctor by ID (All authenticated users)
router.get("/:id", authenticate, doctorController.getDoctorById);

// Update doctor (Admin/Employee)
router.put(
  "/:id",
  authenticate,
  authorize("admin", "employee"),
  validate(updateDoctorSchema),
  doctorController.updateDoctor,
);

// Delete doctor (Admin only)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  doctorController.deleteDoctor,
);

export default router;
