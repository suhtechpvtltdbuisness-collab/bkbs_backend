import Joi from "joi";

export const updateProfileSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).messages({
    "string.alphanum": "Username must only contain alphanumeric characters",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 30 characters",
  }),

  profile: Joi.object({
    firstName: Joi.string().max(50),
    lastName: Joi.string().max(50),
    phoneNumber: Joi.string().pattern(/^[0-9+\-() ]+$/),
    avatar: Joi.string().uri(),
  }).messages({
    "string.max": "Field cannot exceed 50 characters",
    "string.pattern.base": "Invalid phone number format",
    "string.uri": "Avatar must be a valid URL",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required for update",
  });

export const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid("user", "admin", "moderator").required().messages({
    "any.only": "Role must be one of: user, admin, moderator",
    "any.required": "Role is required",
  }),
});

export const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    "any.required": "isActive field is required",
  }),
});

export default {
  updateProfileSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
};
