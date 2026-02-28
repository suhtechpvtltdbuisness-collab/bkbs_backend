import { ApiError } from "../utils/apiResponse.js";

/**
 * Validation middleware factory
 */
export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return next(new ApiError(400, errorMessage));
    }

    // Replace request data with validated and sanitized data
    req[property] = value;
    next();
  };
};

export default validate;
