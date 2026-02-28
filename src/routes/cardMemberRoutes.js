import express from "express";
import cardMemberController from "../controllers/cardMemberController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import {
  addCardMemberSchema,
  addCardMembersSchema,
  updateCardMemberSchema,
} from "../validations/cardMemberValidation.js";

const router = express.Router();

// Protected routes - All card member routes require authentication
router.use(authenticate);

// Card member routes
router.get("/", cardMemberController.getAllCardMembers);
router.get("/:id", cardMemberController.getCardMemberById);

// Get members by card ID
router.get("/card/:cardId", cardMemberController.getMembersByCardId);

// Add single card member
router.post(
  "/card/:cardId",
  validate(addCardMemberSchema),
  cardMemberController.addCardMember,
);

// Add multiple card members
router.post(
  "/card/:cardId/bulk",
  validate(addCardMembersSchema),
  cardMemberController.addCardMembers,
);

router.put(
  "/:id",
  validate(updateCardMemberSchema),
  cardMemberController.updateCardMember,
);

router.delete("/:id", cardMemberController.deleteCardMember);

export default router;
