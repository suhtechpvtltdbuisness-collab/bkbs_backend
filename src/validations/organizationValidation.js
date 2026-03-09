import Joi from "joi";

export const createOrganizationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    "string.min": "Organization name must be at least 2 characters long",
    "string.max": "Organization name cannot exceed 200 characters",
    "any.required": "Organization name is required",
  }),

  type: Joi.string().trim().max(100).messages({
    "string.max": "Type cannot exceed 100 characters",
  }),

  contact: Joi.string()
    .trim()
    .pattern(/^[0-9+\-() ]+$/)
    .messages({
      "string.pattern.base": "Invalid contact number format",
    }),

  location: Joi.string().trim().max(200).messages({
    "string.max": "Location cannot exceed 200 characters",
  }),

  registrationId: Joi.string().trim().max(100).messages({
    "string.max": "Registration ID cannot exceed 100 characters",
  }),

  partnerId: Joi.string().trim().max(100).messages({
    "string.max": "Partner ID cannot exceed 100 characters",
  }),

  establishedYear: Joi.string()
    .trim()
    .pattern(/^\d{4}$/)
    .messages({
      "string.pattern.base": "Established year must be a 4-digit year",
    }),

  bed: Joi.number().integer().min(0).messages({
    "number.min": "Number of beds must be at least 0",
    "number.integer": "Number of beds must be an integer",
  }),

  logo: Joi.string().uri().messages({
    "string.uri": "Logo must be a valid URL",
  }),

  staff: Joi.number().integer().min(0).messages({
    "number.min": "Number of staff must be at least 0",
    "number.integer": "Number of staff must be an integer",
  }),

  ambulance: Joi.string().trim().max(50).messages({
    "string.max": "Ambulance info cannot exceed 50 characters",
  }),

  emergency: Joi.string().trim().max(50).messages({
    "string.max": "Emergency contact cannot exceed 50 characters",
  }),
});

export const updateOrganizationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).messages({
    "string.min": "Organization name must be at least 2 characters long",
    "string.max": "Organization name cannot exceed 200 characters",
  }),

  type: Joi.string().trim().max(100).messages({
    "string.max": "Type cannot exceed 100 characters",
  }),

  contact: Joi.string()
    .trim()
    .pattern(/^[0-9+\-() ]+$/)
    .messages({
      "string.pattern.base": "Invalid contact number format",
    }),

  location: Joi.string().trim().max(200).messages({
    "string.max": "Location cannot exceed 200 characters",
  }),

  registrationId: Joi.string().trim().max(100).messages({
    "string.max": "Registration ID cannot exceed 100 characters",
  }),

  partnerId: Joi.string().trim().max(100).messages({
    "string.max": "Partner ID cannot exceed 100 characters",
  }),

  establishedYear: Joi.date().iso().required().messages({
    "date.format": "Date must be in ISO format (YYYY-MM-DD)",
  }),

  bed: Joi.number().integer().min(0).messages({
    "number.min": "Number of beds must be at least 0",
    "number.integer": "Number of beds must be an integer",
  }),

  logo: Joi.string().uri().messages({
    "string.uri": "Logo must be a valid URL",
  }),

  staff: Joi.number().integer().min(0).messages({
    "number.min": "Number of staff must be at least 0",
    "number.integer": "Number of staff must be an integer",
  }),

  ambulance: Joi.string().trim().max(50).messages({
    "string.max": "Ambulance info cannot exceed 50 characters",
  }),

  emergency: Joi.string().trim().max(50).messages({
    "string.max": "Emergency contact cannot exceed 50 characters",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required for update",
  });
