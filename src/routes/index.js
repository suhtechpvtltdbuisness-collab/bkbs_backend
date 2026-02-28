import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import cardRoutes from "./cardRoutes.js";
import cardMemberRoutes from "./cardMemberRoutes.js";
import hospitalRoutes from "./hospitalRoutes.js";
import partnerRoutes from "./partnerRoutes.js";

const router = express.Router();

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
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
