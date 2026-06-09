import express from "express";
import employeeController from "../controllers/employeeController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/settlements",
  authorize("admin", "editor"),
  employeeController.getEmployeeSettlements,
);

router.post(
  "/settlements",
  authorize("admin", "editor"),
  employeeController.settleEmployeeDay,
);

export default router;
