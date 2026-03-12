import Joi from "joi";

export const createPaymentValidation = Joi.object({
  transactionId: Joi.string().trim().required().messages({
    "string.empty": "Transaction ID is required",
    "any.required": "Transaction ID is required",
  }),
  method: Joi.string().valid("online", "cash").required().messages({
    "any.only": "Payment method must be either 'online' or 'cash'",
    "any.required": "Payment method is required",
  }),
  totalAmount: Joi.number().positive().required().messages({
    "number.base": "Total amount must be a number",
    "number.positive": "Total amount must be positive",
    "any.required": "Total amount is required",
  }),
  date: Joi.date().optional(),
});

export const updatePaymentStatusValidation = Joi.object({
  status: Joi.boolean().required().messages({
    "any.required": "Status is required",
    "boolean.base": "Status must be a boolean value",
  }),
});
