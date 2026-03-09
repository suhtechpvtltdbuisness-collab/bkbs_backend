import express from "express";
import mongoose from "mongoose";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import cardRoutes from "./cardRoutes.js";
import cardMemberRoutes from "./cardMemberRoutes.js";
import hospitalRoutes from "./hospitalRoutes.js";
import organizationRoutes from "./organizationRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import salaryRoutes from "./salaryRoutes.js";

const router = express.Router();

// Health check route with DB status
router.get("/health", async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  let pingResult = null;
  let dbHost = mongoose.connection.host || "not connected";

  try {
    if (dbState === 1) {
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      pingResult = `${Date.now() - pingStart}ms`;
    }
  } catch (error) {
    pingResult = `Failed: ${error.message}`;
  }

  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    message:
      dbState === 1
        ? "Server is running"
        : "Server starting or database unavailable",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus[dbState],
      host: dbHost,
      ping: pingResult,
      mongodbUriConfigured: !!process.env.MONGODB_URI,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION,
    },
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/cards", cardRoutes);
router.use("/card-members", cardMemberRoutes);
router.use("/hospitals", hospitalRoutes);
router.use("/organizations", organizationRoutes);
router.use("/doctors", doctorRoutes);
router.use("/salaries", salaryRoutes);

export default router;
