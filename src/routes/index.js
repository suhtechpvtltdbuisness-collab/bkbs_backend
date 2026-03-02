import express from "express";
import mongoose from "mongoose";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import cardRoutes from "./cardRoutes.js";
import cardMemberRoutes from "./cardMemberRoutes.js";
import hospitalRoutes from "./hospitalRoutes.js";
import partnerRoutes from "./partnerRoutes.js";

const router = express.Router();

// Health check route with DB status
router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    message:
      dbState === 1
        ? "Server is running"
        : "Server starting or database unavailable",
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus[dbState],
      host: mongoose.connection.host || "not connected",
    },
  });
});

// API routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/cards", cardRoutes);
router.use("/card-members", cardMemberRoutes);
router.use("/hospitals", hospitalRoutes);
router.use("/partners", partnerRoutes);

export default router;
