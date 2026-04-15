import express from "express";
import attendanceController from "../controllers/attendanceController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { createAttendanceSchema } from "../validations/attendanceValidation.js";

const router = express.Router();

router.use(authenticate);

// GET /api/attendance/:id (authenticated users)
router.get(
  "/:id",
  authorize("admin", "employee", "user"),
  attendanceController.getAttendanceById,
);

// POST /api/attendance (employee only)
// Body: { campId, currentLat, currentLong }
router.post(
  "/",
  authorize("employee"),
  validate(createAttendanceSchema),
  attendanceController.createAttendance,
);

// GET /api/attendance (admin only)
// Query params: date=YYYY-MM-DD or fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
router.get("/", authorize("admin"), attendanceController.getAllAttendances);

// GET /api/attendance/users/:id (own attendance or admin)
// Query params: date=YYYY-MM-DD or fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
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
