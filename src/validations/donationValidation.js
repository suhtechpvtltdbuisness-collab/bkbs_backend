import Joi from "joi";

export const createDonationSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
  }),
  contact: Joi.string().required().messages({
    "any.required": "Contact is required",
    "string.empty": "Contact cannot be empty",
  }),
  email: Joi.string().email().optional().allow("").messages({
    "string.email": "Please provide a valid email address",
  }),
  location: Joi.string().optional().allow(""),
  date: Joi.string().optional(),
  message: Joi.string().optional().allow(""),
  enquiryId: Joi.string().optional(),
});

export const updateDonationSchema = Joi.object({
  name: Joi.string().optional(),
  contact: Joi.string().optional(),
  email: Joi.string().email().optional().allow("").messages({
    "string.email": "Please provide a valid email address",
  }),
  location: Joi.string().optional().allow(""),
  message: Joi.string().optional().allow(""),
});

export default {
  createDonationSchema,
  updateDonationSchema,
};
