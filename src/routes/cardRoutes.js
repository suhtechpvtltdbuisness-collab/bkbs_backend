import express from "express";
import cardController from "../controllers/cardController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import {
  createCardSchema,
  updateCardSchema,
  updateCardStatusSchema,
  issueCardSchema,
} from "../validations/cardValidation.js";

const router = express.Router();

// Protected routes - All card routes require authentication
router.use(authenticate);

// Card routes
router.get("/", cardController.getAllCards);
router.get("/my-cards", cardController.getMyCards);
router.get("/stats", authorize("admin"), cardController.getCardStats);
router.get("/:id", cardController.getCardById);
router.get("/:id/with-members", cardController.getCardWithMembers);

router.post("/", validate(createCardSchema), cardController.createCard);

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
