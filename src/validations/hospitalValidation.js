import Joi from "joi";

export const createHospitalSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Hospital name is required",
  }),
  address: Joi.string().optional().allow(""),
  website: Joi.string().uri().optional().allow("").messages({
    "string.uri": "Please provide a valid website URL",
  }),
  logo: Joi.string().optional().allow(""),
});

export const updateHospitalSchema = Joi.object({
  name: Joi.string().optional(),
  address: Joi.string().optional().allow(""),
  website: Joi.string().uri().optional().allow("").messages({
    "string.uri": "Please provide a valid website URL",
  }),
  logo: Joi.string().optional().allow(""),
});

export default {
  createHospitalSchema,
  updateHospitalSchema,
};
