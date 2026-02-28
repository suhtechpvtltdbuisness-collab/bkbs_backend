import dotenv from "dotenv";

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5003,

  database: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/bkbs_db",
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "access_secret_key",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "refresh_secret_key",
    accessExpire: process.env.JWT_ACCESS_EXPIRE || "15m",
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || "7d",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};

export default config;
