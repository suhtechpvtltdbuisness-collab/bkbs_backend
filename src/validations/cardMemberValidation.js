import Joi from "joi";

export const addCardMemberSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Name is required",
  }),
  relation: Joi.string().required().messages({
    "any.required": "Relation is required",
  }),
  age: Joi.number().min(0).max(150).required().messages({
    "any.required": "Age is required",
    "number.min": "Age must be a positive number",
    "number.max": "Age must be less than 150",
  }),
});

export const addCardMembersSchema = Joi.object({
  members: Joi.array().items(addCardMemberSchema).min(1).required().messages({
    "any.required": "Members array is required",
    "array.min": "At least one member is required",
  }),
});

export const updateCardMemberSchema = Joi.object({
  name: Joi.string().optional(),
  relation: Joi.string().optional(),
  age: Joi.number().min(0).max(150).optional().messages({
    "number.min": "Age must be a positive number",
    "number.max": "Age must be less than 150",
  }),
});

export default {
  addCardMemberSchema,
  addCardMembersSchema,
  updateCardMemberSchema,
};
