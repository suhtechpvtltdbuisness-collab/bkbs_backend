import express from "express";
import cardController from "../controllers/cardController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { uploadCardDocuments, uploadDistributionImage } from "../middlewares/upload.js";
import {
  createCardSchema,
  updateCardSchema,
  updateCardStatusSchema,
  issueCardSchema,
  updateIsPrintSchema,
} from "../validations/cardValidation.js";

const router = express.Router();

// Public routes - No authentication required
router.get("/card/:cardNo", cardController.getCardByCardNo);
router.post(
  "/card-users",
  uploadCardDocuments,
  validate(createCardSchema),
  cardController.createCardPublic,
);

router.get("/check/phone", cardController.checkPhoneExists);
router.get("/check/name", cardController.checkNameExists);
router.get("/check/email", cardController.checkEmailExists);
router.get("/check/aadhaar", cardController.checkAadhaarExists);

// Authenticated specific GET routes — registered before the public "/:id"
// route so single-segment paths (e.g. /printed) are not shadowed by it.
router.get(
  "/",
  authenticate,
  authorize("admin", "editor", "employee"),
  cardController.getAllCards,
);
router.get(
  "/verified/not-printed",
  authenticate,
  cardController.getAllVerifiedCards,
);
router.get("/printed", authenticate, cardController.getAllPrintedCards);
router.get("/my-cards", authenticate, cardController.getMyCards);
router.get(
  "/employee/:employeeId",
  authenticate,
  authorize("admin", "editor"),
  cardController.getCardsByEmployee,
);
router.get("/stats", authenticate, authorize("admin"), cardController.getCardStats);

router.put(
  "/print-status",
  authenticate,
  authorize("admin", "employee"),
  validate(updateIsPrintSchema),
  cardController.updateIsPrintStatus,
);

// Public route - get card by ID (no authentication required)
router.get("/:id", cardController.getCardById);

// Protected routes - everything below requires authentication
router.use(authenticate);

router.get("/:id/with-members", cardController.getCardWithMembers);

router.post(
  "/",
  authorize("admin", "employee", "editor"),
  uploadCardDocuments,
  validate(createCardSchema),
  cardController.createCard,
);

router.put("/:id", validate(updateCardSchema), cardController.updateCard);

router.patch(
  "/:id/status",
  authorize("admin", "employee"),
  validate(updateCardStatusSchema),
  cardController.updateCardStatus,
);

router.patch(
  "/:id/distribute",
  authorize("admin", "editor", "employee"),
  uploadDistributionImage,
  cardController.distributeCard,
);

router.patch(
  "/:id/issue",
  authorize("admin", "employee"),
  validate(issueCardSchema),
  cardController.issueCard,
);

router.delete(
  "/:id",
  authorize("admin", "editor"),
  cardController.deleteCard,
);

export default router;
