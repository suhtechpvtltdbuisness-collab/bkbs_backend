import express from "express";
import cardController from "../controllers/cardController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { uploadCardDocuments } from "../middlewares/upload.js";
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

// Protected routes - All card routes require authentication
router.use(authenticate);

// Card routes
router.get("/", cardController.getAllCards);
router.get("/verified/not-printed", cardController.getAllVerifiedCards);
router.get("/printed", cardController.getAllPrintedCards);
router.get("/my-cards", cardController.getMyCards);
router.get("/stats", authorize("admin"), cardController.getCardStats);

router.put(
  "/print-status",
  authorize("admin", "employee"),
  validate(updateIsPrintSchema),
  cardController.updateIsPrintStatus,
);
router.get("/:id", cardController.getCardById);
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
  "/:id/issue",
  authorize("admin", "employee"),
  validate(issueCardSchema),
  cardController.issueCard,
);

router.delete(
  "/:id",
  authorize("admin", "employee"),
  cardController.deleteCard,
);

export default router;
