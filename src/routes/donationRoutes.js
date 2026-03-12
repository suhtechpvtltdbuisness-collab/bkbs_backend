import express from "express";
import donationController from "../controllers/donationController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import {
  createDonationSchema,
  updateDonationSchema,
} from "../validations/donationValidation.js";

const router = express.Router();

// Public routes - No authentication required
router.post(
  "/",
  validate(createDonationSchema),
  donationController.createDonation,
);
router.get("/enquiry/:enquiryId", donationController.getDonationByEnquiryId);

// Protected routes - All other donation routes require authentication
router.use(authenticate);

// Donation routes
router.get("/", donationController.getAllDonations);
router.get("/stats", authorize("admin"), donationController.getDonationStats);
router.get("/:id", donationController.getDonationById);

router.put(
  "/:id",
  authorize("admin", "employee"),
  validate(updateDonationSchema),
  donationController.updateDonation,
);

router.delete(
  "/:id",
  authorize("admin", "employee"),
  donationController.deleteDonation,
);

export default router;
