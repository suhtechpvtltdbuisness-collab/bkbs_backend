import express from "express";
import attendanceController from "../controllers/attendanceController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

// GET /api/attendance/:id (authenticated users)
router.get(
  "/:id",
  authorize("admin", "employee", "user"),
  attendanceController.getAttendanceById,
);

// POST /api/attendance (employee only)
router.post("/", authorize("employee"), attendanceController.createAttendance);

// GET /api/attendance (admin only)
router.get("/", authorize("admin"), attendanceController.getAllAttendances);

// GET /api/attendance/users/:id (own attendance or admin)
router.get(
  "/users/:id",
  authorize("admin", "employee", "user"),
  attendanceController.getAttendanceByUserId,
);

// PUT /api/attendance/:id (admin only)
router.put("/:id", authorize("admin"), attendanceController.updateAttendance);

// DELETE /api/attendance/:id (admin only)
router.delete(
  "/:id",
  authorize("admin"),
  attendanceController.deleteAttendance,
);

export default router;
