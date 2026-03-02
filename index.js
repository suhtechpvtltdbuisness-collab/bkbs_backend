import app from "./src/app.js";

// Log cold start info
console.log("🌟 Vercel Serverless Function - Cold Start");
console.log("📍 Environment:", process.env.NODE_ENV);
console.log("🔐 MONGODB_URI configured:", !!process.env.MONGODB_URI);
console.log("🌍 Region:", process.env.VERCEL_REGION || "unknown");

// Export the Express app directly for Vercel
// Connection handling is done in app.js middleware
export default app;
