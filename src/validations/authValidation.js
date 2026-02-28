import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),

  role: Joi.string()
    .valid("user", "admin", "moderator", "employee")
    .required()
    .messages({
      "any.only": "Role must be one of: user, admin, moderator, employee",
      "any.required": "Role is required",
    }),

  isAdmin: Joi.boolean().default(false),

  employeeId: Joi.string().alphanum().max(50).optional().messages({
    "string.alphanum": "Employee ID must only contain alphanumeric characters",
    "string.max": "Employee ID cannot exceed 50 characters",
  }),

  contact: Joi.string().max(20).optional().messages({
    "string.max": "Contact cannot exceed 20 characters",
  }),

  email: Joi.string().email().optional().messages({
    "string.email": "Please provide a valid email address",
  }),

  password: Joi.string().min(6).max(128).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "string.max": "Password cannot exceed 128 characters",
    "any.required": "Password is required",
  }),

  dateOfJoining: Joi.string().optional(),

  location: Joi.string().max(200).optional().messages({
    "string.max": "Location cannot exceed 200 characters",
  }),

  salary: Joi.number().min(0).optional().messages({
    "number.min": "Salary must be a positive number",
  }),

  workStartTime: Joi.string().optional(),

  workEndTime: Joi.string().optional(),

  createdBy: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    "any.required": "Refresh token is required",
  }),
});

export default {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
};
