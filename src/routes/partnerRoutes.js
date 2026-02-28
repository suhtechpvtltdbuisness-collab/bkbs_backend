import express from "express";
import partnerController from "../controllers/partnerController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import {
  createPartnerSchema,
  updatePartnerSchema,
} from "../validations/partnerValidation.js";

const router = express.Router();

// Protected routes - All partner routes require authentication
router.use(authenticate);

// Partner routes
router.get("/", partnerController.getAllPartners);
router.get("/search", partnerController.searchPartners);
router.get("/stats", authorize("admin"), partnerController.getPartnerStats);
router.get("/location/:location", partnerController.getPartnersByLocation);
router.get("/:id", partnerController.getPartnerById);

router.post(
  "/",
  authorize("admin"),
  validate(createPartnerSchema),
  partnerController.createPartner,
);

router.put(
  "/:id",
  authorize("admin"),
  validate(updatePartnerSchema),
  partnerController.updatePartner,
);

router.delete("/:id", authorize("admin"), partnerController.deletePartner);

export default router;
