import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/database.js";
import { config } from "./config/env.js";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Start server
const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🚀 Server is running                    ║
║   📡 Port: ${PORT}                        ║
║   🌍 Environment: ${config.env}           ║
║   📝 API Docs: http://localhost:${PORT}/api/health
║                                           ║
╚═══════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Process terminated");
  });
});

export default server;
