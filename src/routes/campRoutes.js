import express from "express";
import campController from "../controllers/campController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import {
  createCampSchema,
  updateCampSchema,
} from "../validations/campValidation.js";

const router = express.Router();

router.use(authenticate);

router.get("/", campController.getAllCamps);
router.get("/:id", campController.getCampById);

router.post(
  "/",
  authorize("admin", "editor"),
  validate(createCampSchema),
  campController.createCamp,
);

router.put(
  "/:id",
  authorize("admin", "editor"),
  validate(updateCampSchema),
  campController.updateCamp,
);

router.delete("/:id", authorize("admin"), campController.deleteCamp);

export default router;