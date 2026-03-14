import Joi from "joi";

export const createDoctorSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),

  specialty: Joi.string().trim().max(100).messages({
    "string.max": "Specialty cannot exceed 100 characters",
  }),

  timeFrom: Joi.string()
    .trim()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      "string.pattern.base": "Time from must be in HH:MM format",
    }),

  timeTo: Joi.string()
    .trim()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      "string.pattern.base": "Time to must be in HH:MM format",
    }),

  location: Joi.string().trim().max(200).messages({
    "string.max": "Location cannot exceed 200 characters",
  }),

  logo: Joi.string().trim().max(1000).allow(""),

  organizationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid organization ID format",
      "any.required": "Organization ID is required",
    }),

  days: Joi.array()
    .items(Joi.string().valid("mon", "tue", "wed", "thu", "fri", "sat", "sun"))
    .messages({
      "array.includes":
        "Days must be one of: mon, tue, wed, thu, fri, sat, sun",
    }),
});

export const updateDoctorSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
  }),

  specialty: Joi.string().trim().max(100).messages({
    "string.max": "Specialty cannot exceed 100 characters",
  }),

  timeFrom: Joi.string()
    .trim()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      "string.pattern.base": "Time from must be in HH:MM format",
    }),

  timeTo: Joi.string()
    .trim()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      "string.pattern.base": "Time to must be in HH:MM format",
    }),

  location: Joi.string().trim().max(200).messages({
    "string.max": "Location cannot exceed 200 characters",
  }),

  logo: Joi.string().trim().max(1000).allow(""),

  organizationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid organization ID format",
    }),

  days: Joi.array()
    .items(Joi.string().valid("mon", "tue", "wed", "thu", "fri", "sat", "sun"))
    .messages({
      "array.includes":
        "Days must be one of: mon, tue, wed, thu, fri, sat, sun",
    }),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required for update",
  });
