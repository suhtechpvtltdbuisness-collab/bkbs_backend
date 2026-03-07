import express from "express";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import connectDB from "./config/database.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { generalLimiter } from "./middlewares/rateLimiter.js";
import checkFileExists from "./middlewares/checkFileExists.js";

const app = express();

// Trust proxy for Vercel/serverless environments
app.set("trust proxy", 1);

// Database connection middleware for serverless
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed in middleware:", error);
    return res.status(503).json({
      success: false,
      message: "Database connection unavailable",
      error: error.message,
    });
  }
});

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Check if files exist before serving (provides better error messages)
app.use("/uploads", checkFileExists);

// Serve uploaded files statically
// For local development
app.use("/uploads", express.static("uploads"));
// For serverless environments (Vercel, Lambda) - serves from /tmp
app.use("/uploads", express.static("/tmp/uploads"));

// Rate limiting
app.use("/api", generalLimiter);

// Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to BKBS Backend API",
    version: "1.0.0",
    documentation: "/api/health",
  });
});

app.use("/api", routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
