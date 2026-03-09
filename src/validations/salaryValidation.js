import Joi from "joi";

/**
 * Validation schema for creating a salary record
 */
export const createSalarySchema = Joi.object({
  employeeId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Employee ID must be a valid MongoDB ObjectId",
      "any.required": "Employee ID is required",
    }),
  date: Joi.string().required().messages({
    "any.required": "Salary date is required",
  }),
  status: Joi.string()
    .valid("pending", "paid", "cancelled", "processing")
    .default("pending")
    .messages({
      "any.only": "Status must be one of: pending, paid, cancelled, processing",
    }),
  amount: Joi.number().positive().required().messages({
    "number.positive": "Amount must be a positive number",
    "any.required": "Amount is required",
  }),
  method: Joi.string()
    .valid("bank_transfer", "cash", "cheque", "upi", "other")
    .default("bank_transfer")
    .messages({
      "any.only":
        "Payment method must be one of: bank_transfer, cash, cheque, upi, other",
    }),
  notes: Joi.string().max(500).optional().messages({
    "string.max": "Notes cannot exceed 500 characters",
  }),
});

/**
 * Validation schema for updating salary status and method
 */
export const updateSalaryStatusAndMethodSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "paid", "cancelled", "processing")
    .optional()
    .messages({
      "any.only": "Status must be one of: pending, paid, cancelled, processing",
    }),
  method: Joi.string()
    .valid("bank_transfer", "cash", "cheque", "upi", "other")
    .optional()
    .messages({
      "any.only":
        "Payment method must be one of: bank_transfer, cash, cheque, upi, other",
    }),
})
  .min(1)
  .messages({
    "object.min": "At least one field (status or method) must be provided",
  });

/**
 * Validation schema for updating salary record
 */
export const updateSalarySchema = Joi.object({
  employeeId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Employee ID must be a valid MongoDB ObjectId",
    }),
  date: Joi.string().optional(),
  status: Joi.string()
    .valid("pending", "paid", "cancelled", "processing")
    .optional()
    .messages({
      "any.only": "Status must be one of: pending, paid, cancelled, processing",
    }),
  amount: Joi.number().positive().optional().messages({
    "number.positive": "Amount must be a positive number",
  }),
  method: Joi.string()
    .valid("bank_transfer", "cash", "cheque", "upi", "other")
    .optional()
    .messages({
      "any.only":
        "Payment method must be one of: bank_transfer, cash, cheque, upi, other",
    }),
  notes: Joi.string().max(500).optional().messages({
    "string.max": "Notes cannot exceed 500 characters",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

/**
 * Validation schema for query parameters
 */
export const getSalariesQuerySchema = Joi.object({
  employeeId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Employee ID must be a valid MongoDB ObjectId",
    }),
  status: Joi.string()
    .valid("pending", "paid", "cancelled", "processing")
    .optional(),
  method: Joi.string()
    .valid("bank_transfer", "cash", "cheque", "upi", "other")
    .optional(),
  startDate: Joi.string().optional(),
  endDate: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().optional().default("-createdAt"),
});
