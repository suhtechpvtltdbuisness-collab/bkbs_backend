import Joi from "joi";

export const createCardSchema = Joi.object({
  applicationId: Joi.string().optional(),
  applicationDate: Joi.string().optional(),
  status: Joi.string()
    .valid("pending", "approved", "rejected", "active", "expired")
    .optional(),
  firstName: Joi.string().required().messages({
    "any.required": "First name is required",
  }),
  middleName: Joi.string().optional().allow(""),
  lastName: Joi.string().optional().allow(""),
  contact: Joi.string().required().messages({
    "any.required": "Contact is required",
  }),
  alternateContact: Joi.string().optional().allow(""),
  email: Joi.string().email().optional().allow("").messages({
    "string.email": "Please provide a valid email address",
  }),
  relation: Joi.string().optional().allow(""),
  relatedPerson: Joi.string().optional().allow(""),
  religion: Joi.string().optional().allow(""),
  dob: Joi.string().optional().allow(""),
  pincode: Joi.string().optional().allow(""),
  aadhaarNumber: Joi.string()
    .pattern(/^\d{12}$/)
    .optional()
    .messages({
      "string.pattern.base": "Aadhaar number must be exactly 12 digits",
    }),
  cardNo: Joi.string().optional(),
  cardIssueDate: Joi.string().optional().allow(""),
  cardExpiredDate: Joi.string().optional().allow(""),
  verificationDate: Joi.string().optional().allow(""),
  totalMember: Joi.number().min(0).optional(),
  totalAmount: Joi.number().min(0).optional(),
  isPrint: Joi.boolean().optional(),
  documents: Joi.array()
    .items(
      Joi.object({
        filename: Joi.string().optional(),
        originalName: Joi.string().optional(),
        path: Joi.string().optional(),
        size: Joi.number().optional(),
        mimetype: Joi.string().optional(),
        uploadedAt: Joi.date().optional(),
      }),
    )
    .max(5)
    .optional(),
  members: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().messages({
          "any.required": "Member name is required",
        }),
        relation: Joi.string().required().messages({
          "any.required": "Member relation is required",
        }),
        documentId: Joi.string().optional().allow(""),
        age: Joi.number().required().min(0).messages({
          "any.required": "Member age is required",
          "number.min": "Age must be a positive number",
        }),
      }),
    )
    .optional(),
  payment: Joi.object({
    method: Joi.string()
      .valid("online", "cash", "offline")
      .required()
      .messages({
        "any.only":
          "Payment method must be either 'online', 'cash', or 'offline'",
        "any.required": "Payment method is required",
      }),
    transactionId: Joi.when("method", {
      is: Joi.string().valid("cash", "offline"),
      then: Joi.string().trim().required().messages({
        "string.empty": "Transaction ID is required for offline/cash payments",
        "any.required": "Transaction ID is required for offline/cash payments",
      }),
      otherwise: Joi.string().trim().optional().allow(""),
    }),
    totalAmount: Joi.number().positive().required().messages({
      "number.base": "Total amount must be a number",
      "number.positive": "Total amount must be positive",
      "any.required": "Total amount is required",
    }),
    date: Joi.date().optional(),
  }).optional(),
});

export const updateCardSchema = Joi.object({
  applicationDate: Joi.string().optional(),
  status: Joi.string()
    .valid("pending", "approved", "rejected", "active", "expired")
    .optional(),
  firstName: Joi.string().optional(),
  middleName: Joi.string().optional().allow(""),
  lastName: Joi.string().optional().allow(""),
  contact: Joi.string().optional(),
  alternateContact: Joi.string().optional().allow(""),
  email: Joi.string().email().optional().allow("").messages({
    "string.email": "Please provide a valid email address",
  }),
  relation: Joi.string().optional().allow(""),
  relatedPerson: Joi.string().optional().allow(""),
  religion: Joi.string().optional().allow(""),
  dob: Joi.string().optional().allow(""),
  pincode: Joi.string().optional().allow(""),
  aadhaarNumber: Joi.string()
    .pattern(/^\d{12}$/)
    .optional()
    .messages({
      "string.pattern.base": "Aadhaar number must be exactly 12 digits",
    }),
  cardNo: Joi.string().optional(),
  cardIssueDate: Joi.string().optional(),
  cardExpiredDate: Joi.string().optional(),
  verificationDate: Joi.string().optional(),
  totalMember: Joi.number().min(0).optional(),
  totalAmount: Joi.number().min(0).optional(),
  isPrint: Joi.boolean().optional(),
});

export const updateCardStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "approved", "rejected", "active", "expired")
    .required()
    .messages({
      "any.required": "Status is required",
      "any.only":
        "Status must be one of: pending, approved, rejected, active, expired",
    }),
});

export const issueCardSchema = Joi.object({
  cardNo: Joi.string().optional(),
  cardIssueDate: Joi.string().optional(),
  cardExpiredDate: Joi.string().optional(),
});

export const updateIsPrintSchema = Joi.object({
  cardIds: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .required()
    .messages({
      "array.base": "cardIds must be an array",
      "array.min": "cardIds must contain at least one card ID",
      "any.required": "cardIds is required",
    }),
});

export default {
  createCardSchema,
  updateCardSchema,
  updateCardStatusSchema,
  issueCardSchema,
};
