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

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Parse settlement/card date strings into { y, m, d, iso }.
 */
export const parseCalendarDate = (dateStr) => {
  if (!dateStr) {
    const now = new Date(Date.now() + IST_OFFSET_MS);
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + 1;
    const d = now.getUTCDate();
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return { y, m, d, iso };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return { y, m, d, iso: dateStr };
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("-").map(Number);
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return { y, m, d, iso };
  }

  const dt = new Date(dateStr);
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth() + 1;
  const d = dt.getUTCDate();
  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { y, m, d, iso };
};

/**
 * IST calendar-day range for settlement queries (matches India-local business days).
 */
export const getISTDayRange = (dateStr) => {
  const { y, m, d, iso } = parseCalendarDate(dateStr);

  return {
    start: new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - IST_OFFSET_MS),
    end: new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - IST_OFFSET_MS),
    isoDate: iso,
  };
};

export default {
  extractToken,
  getClientIp,
  getUserAgent,
  paginate,
  filterSensitiveData,
  parseCalendarDate,
  getISTDayRange,
};
