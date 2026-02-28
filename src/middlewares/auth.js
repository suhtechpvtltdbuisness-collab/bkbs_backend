import { verifyAccessToken } from "../utils/jwt.js";
import { extractToken } from "../utils/helpers.js";
import { ApiError } from "../utils/apiResponse.js";
import authService from "../services/authService.js";

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from request
    const token = extractToken(req);

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Validate user
    const user = await authService.validateUser(decoded.userId);

    // Attach user to request
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    next(new ApiError(401, "Invalid or expired token"));
  }
};

/**
 * Authorization middleware - checks user roles
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to access this resource"),
      );
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await authService.validateUser(decoded.userId);

      req.user = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      };
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

export default {
  authenticate,
  authorize,
  optionalAuth,
};
