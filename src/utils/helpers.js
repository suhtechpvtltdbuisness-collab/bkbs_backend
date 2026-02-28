/**
 * Extract token from request headers
 * @param {Object} req - Express request object
 * @returns {String|null} Token or null
 */
export const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check for token in cookies
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};

/**
 * Get client IP address
 * @param {Object} req - Express request object
 * @returns {String} IP address
 */
export const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

/**
 * Get user agent from request
 * @param {Object} req - Express request object
 * @returns {String} User agent
 */
export const getUserAgent = (req) => {
  return req.headers["user-agent"] || "unknown";
};

/**
 * Paginate helper
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @returns {Object} Pagination object
 */
export const paginate = (page = 1, limit = 10) => {
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);

  return {
    page: parsedPage > 0 ? parsedPage : 1,
    limit: parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 10,
  };
};

/**
 * Filter sensitive data from object
 * @param {Object} obj - Object to filter
 * @param {Array} sensitiveFields - Fields to remove
 * @returns {Object} Filtered object
 */
export const filterSensitiveData = (
  obj,
  sensitiveFields = ["password", "refreshToken"],
) => {
  const filtered = { ...obj };
  sensitiveFields.forEach((field) => delete filtered[field]);
  return filtered;
};

export default {
  extractToken,
  getClientIp,
  getUserAgent,
  paginate,
  filterSensitiveData,
};
