import Joi from "joi";

export const createAttendanceSchema = Joi.object({
  campId: Joi.string().trim().required().messages({
    "any.required": "campId is required",
    "string.empty": "campId is required",
  }),
  currentLat: Joi.number().min(-90).max(90).required().messages({
    "number.base": "currentLat must be a number",
    "number.min": "currentLat must be greater than or equal to -90",
    "number.max": "currentLat must be less than or equal to 90",
    "any.required": "currentLat is required",
  }),
  currentLong: Joi.number().min(-180).max(180).required().messages({
    "number.base": "currentLong must be a number",
    "number.min": "currentLong must be greater than or equal to -180",
    "number.max": "currentLong must be less than or equal to 180",
    "any.required": "currentLong is required",
  }),
});

export default {
  createAttendanceSchema,
};
