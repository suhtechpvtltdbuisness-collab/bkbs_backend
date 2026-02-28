import express from "express";
import hospitalController from "../controllers/hospitalController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import {
  createHospitalSchema,
  updateHospitalSchema,
} from "../validations/hospitalValidation.js";

const router = express.Router();

// Protected routes - All hospital routes require authentication
router.use(authenticate);

// Hospital routes
router.get("/", hospitalController.getAllHospitals);
router.get("/search", hospitalController.searchHospitals);
router.get("/stats", authorize("admin"), hospitalController.getHospitalStats);
router.get("/:id", hospitalController.getHospitalById);

router.post(
  "/",
  authorize("admin"),
  validate(createHospitalSchema),
  hospitalController.createHospital,
);

router.put(
  "/:id",
  authorize("admin"),
  validate(updateHospitalSchema),
  hospitalController.updateHospital,
);

router.delete("/:id", authorize("admin"), hospitalController.deleteHospital);

export default router;
