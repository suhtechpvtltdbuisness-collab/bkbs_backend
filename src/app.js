import express from "express";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { generalLimiter } from "./middlewares/rateLimiter.js";

const app = express();

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
