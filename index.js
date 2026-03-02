import app from "./src/app.js";
import connectDB from "./src/config/database.js";

// Test database connection on cold start
console.log("🌟 Serverless function cold start");
console.log("🔍 Environment:", process.env.NODE_ENV);
console.log("🔍 MONGODB_URI exists:", !!process.env.MONGODB_URI);
console.log("🔍 Vercel region:", process.env.VERCEL_REGION || "unknown");

// Handler for Vercel serverless functions
const handler = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log(`\n🚀 ${req.method} ${req.url} - Starting request`);
    console.log(`🌐 Client IP: ${req.headers["x-forwarded-for"] || req.connection.remoteAddress}`);

    // Ensure database connection is established
    console.log("📡 Establishing database connection...");
    const connectionStart = Date.now();
    
    const connection = await connectDB();
    
    const connectionTime = Date.now() - connectionStart;
    console.log(`✅ Database connection confirmed in ${connectionTime}ms - State: ${connection.readyState}`);

    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Handler error after ${totalTime}ms:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    return res.status(503).json({
      success: false,
      message: "Service temporarily unavailable - Database connection failed",
      error: error.message,
      details: "Please check MongoDB Atlas network access and connection string",
    });
  }
};

// Export the handler for Vercel
export default handler;
