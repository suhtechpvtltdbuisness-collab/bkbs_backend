import Joi from "joi";

const latitudeSchema = Joi.number().min(-90).max(90).messages({
  "number.base": "Latitude must be a number",
  "number.min": "Latitude must be greater than or equal to -90",
  "number.max": "Latitude must be less than or equal to 90",
});

const longitudeSchema = Joi.number().min(-180).max(180).messages({
  "number.base": "Longitude must be a number",
  "number.min": "Longitude must be greater than or equal to -180",
  "number.max": "Longitude must be less than or equal to 180",
});

export const createCampSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required().messages({
    "string.min": "Camp name must be at least 2 characters long",
    "string.max": "Camp name cannot exceed 200 characters",
    "any.required": "Camp name is required",
  }),
  lat: latitudeSchema.required().messages({
    "any.required": "Camp latitude is required",
  }),
  long: longitudeSchema.required().messages({
    "any.required": "Camp longitude is required",
  }),
  city: Joi.string().trim().min(2).max(120).required().messages({
    "string.min": "Camp city must be at least 2 characters long",
    "string.max": "Camp city cannot exceed 120 characters",
    "any.required": "Camp city is required",
  }),
  state: Joi.string().trim().min(2).max(120).required().messages({
    "string.min": "Camp state must be at least 2 characters long",
    "string.max": "Camp state cannot exceed 120 characters",
    "any.required": "Camp state is required",
  }),
  date: Joi.date().iso().required().messages({
    "date.format": "Camp date must be in ISO format (YYYY-MM-DD)",
    "any.required": "Camp date is required",
  }),
});

export const updateCampSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).messages({
    "string.min": "Camp name must be at least 2 characters long",
    "string.max": "Camp name cannot exceed 200 characters",
  }),
  lat: latitudeSchema,
  long: longitudeSchema,
  city: Joi.string().trim().min(2).max(120).messages({
    "string.min": "Camp city must be at least 2 characters long",
    "string.max": "Camp city cannot exceed 120 characters",
  }),
  state: Joi.string().trim().min(2).max(120).messages({
    "string.min": "Camp state must be at least 2 characters long",
    "string.max": "Camp state cannot exceed 120 characters",
  }),
  date: Joi.date().iso().messages({
    "date.format": "Camp date must be in ISO format (YYYY-MM-DD)",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required for update",
  });

export default {
  createCampSchema,
  updateCampSchema,
};
