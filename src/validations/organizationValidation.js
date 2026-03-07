import Joi from "joi";

export const createOrganizationSchema = Joi.object({
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
})
  .min(1)
  .messages({
    "object.min": "At least one field is required for update",
  });
