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
  cardNo: Joi.string().optional(),
  cardIssueDate: Joi.string().optional(),
  cardExpiredDate: Joi.string().optional(),
  verificationDate: Joi.string().optional(),
  totalMember: Joi.number().min(0).optional(),
  totalAmount: Joi.number().min(0).optional(),
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
  cardNo: Joi.string().optional(),
  cardIssueDate: Joi.string().optional(),
  cardExpiredDate: Joi.string().optional(),
  verificationDate: Joi.string().optional(),
  totalMember: Joi.number().min(0).optional(),
  totalAmount: Joi.number().min(0).optional(),
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

export default {
  createCardSchema,
  updateCardSchema,
  updateCardStatusSchema,
  issueCardSchema,
};
