import Joi from "joi";

export const createPartnerSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Partner name is required",
  }),
  specialty: Joi.string().optional().allow(""),
  timeFrom: Joi.string().optional().allow(""),
  timeTo: Joi.string().optional().allow(""),
  location: Joi.string().optional().allow(""),
  days: Joi.array()
    .items(Joi.string().valid("mon", "tue", "wed", "thu", "fri", "sat", "sun"))
    .optional()
    .messages({
      "any.only": "Days must be one of: mon, tue, wed, thu, fri, sat, sun",
    }),
});

export const updatePartnerSchema = Joi.object({
  name: Joi.string().optional(),
  specialty: Joi.string().optional().allow(""),
  timeFrom: Joi.string().optional().allow(""),
  timeTo: Joi.string().optional().allow(""),
  location: Joi.string().optional().allow(""),
  days: Joi.array()
    .items(Joi.string().valid("mon", "tue", "wed", "thu", "fri", "sat", "sun"))
    .optional()
    .messages({
      "any.only": "Days must be one of: mon, tue, wed, thu, fri, sat, sun",
    }),
});

export default {
  createPartnerSchema,
  updatePartnerSchema,
};
