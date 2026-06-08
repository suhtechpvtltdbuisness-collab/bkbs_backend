import Joi from "joi";

export const createDuplicateReceiptSchema = Joi.object({
  cardId: Joi.string().required().messages({
    "any.required": "cardId is required",
  }),
  penaltyAmount: Joi.number().min(0).optional(),
  paymentMethod: Joi.string().valid("online", "offline").required().messages({
    "any.only": "Payment method must be either 'online' or 'offline'",
    "any.required": "Payment method is required",
  }),
  paymentRef: Joi.when("paymentMethod", {
    is: "online",
    then: Joi.string().trim().required().messages({
      "string.empty": "paymentRef is required for online payments",
      "any.required": "paymentRef is required for online payments",
    }),
    otherwise: Joi.string().trim().optional().allow(""),
  }),
  paymentStatus: Joi.string().valid("paid", "pending").optional(),
  paymentProofImage: Joi.string().optional().allow(""),
});

export default {
  createDuplicateReceiptSchema,
};
