import express from "express";
import salaryController from "../controllers/salaryController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import {
  createSalarySchema,
  updateSalaryStatusAndMethodSchema,
  updateSalarySchema,
  getSalariesQuerySchema,
} from "../validations/salaryValidation.js";

const router = express.Router();

// Protected routes - All salary routes require authentication
router.use(authenticate);

// Salary routes
// GET routes
router.get(
  "/",
  authorize("admin", "employee"),
  validate(getSalariesQuerySchema, "query"),
  salaryController.getAllSalaries,
);

router.get("/stats", authorize("admin"), salaryController.getSalaryStatistics);

router.get(
  "/employee/:employeeId",
  authorize("admin", "employee"),
  salaryController.getSalariesByEmployeeId,
);

router.get(
  "/:id",
  authorize("admin", "employee"),
  salaryController.getSalaryById,
);

// POST routes
router.post(
  "/",
  authorize("admin", "employee"),
  validate(createSalarySchema),
  salaryController.createSalary,
);

// PATCH routes
router.patch(
  "/:id/status",
  authorize("admin", "employee"),
  validate(updateSalaryStatusAndMethodSchema),
  salaryController.updateSalaryStatusAndMethod,
);

// PUT routes
router.put(
  "/:id",
  authorize("admin"),
  validate(updateSalarySchema),
  salaryController.updateSalary,
);

// DELETE routes
router.delete("/:id", authorize("admin"), salaryController.deleteSalary);

export default router;
