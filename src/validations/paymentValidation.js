import Joi from "joi";

export const createCashfreeOrderValidation = Joi.object({
  amount: Joi.number().positive().required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "any.required": "Amount is required",
  }),
  customerId: Joi.string().trim().optional().allow(""),
  customerName: Joi.string().trim().required().messages({
    "string.empty": "Customer name is required",
    "any.required": "Customer name is required",
  }),
  customerEmail: Joi.string().email().required().messages({
    "string.email": "Customer email must be valid",
    "any.required": "Customer email is required",
  }),
  customerPhone: Joi.string().trim().required().messages({
    "string.empty": "Customer phone is required",
    "any.required": "Customer phone is required",
  }),
  cardId: Joi.string().trim().optional(),
  paymentMethod: Joi.string()
    .valid("online", "cash", "upi", "card", "netbanking", "wallet")
    .default("online")
    .messages({
      "any.only":
        "Payment method must be one of: online, cash, upi, card, netbanking, wallet",
    }),
});

export const createPaymentValidation = Joi.object({
  orderId: Joi.string().trim().optional(),
  transactionId: Joi.string().trim().optional(),
  paymentMethod: Joi.string()
    .valid("online", "cash", "upi", "card", "netbanking", "wallet")
    .required()
    .messages({
      "any.only":
        "Payment method must be one of: online, cash, upi, card, netbanking, wallet",
      "any.required": "Payment method is required",
    }),
  amount: Joi.number().positive().required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "any.required": "Amount is required",
  }),
  status: Joi.string().valid("PENDING", "SUCCESS", "FAILED").optional(),
  date: Joi.date().optional(),
})
  .or("orderId", "transactionId")
  .messages({
    "object.missing": "Either orderId or transactionId is required",
  });

export const updatePaymentStatusValidation = Joi.object({
  status: Joi.string()
    .valid("PENDING", "SUCCESS", "FAILED")
    .required()
    .messages({
      "any.required": "Status is required",
      "any.only": "Status must be one of: PENDING, SUCCESS, FAILED",
    }),
});
