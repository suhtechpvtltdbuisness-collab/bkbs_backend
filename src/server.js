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

  // Warn about file storage in production
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log(`
⚠️  WARNING: File Upload Limitation Detected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Running in serverless environment. Files are stored in /tmp
which is temporary and will be deleted after execution.

❌ Files will NOT persist between requests
❌ Files are NOT accessible after function timeout
❌ Not suitable for production use

✅ RECOMMENDED: Migrate to cloud storage
   - AWS S3
   - Cloudinary
   - Vercel Blob Storage
   - Azure Blob Storage

See SERVERLESS_FILE_UPLOAD.md for migration guide
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }
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
