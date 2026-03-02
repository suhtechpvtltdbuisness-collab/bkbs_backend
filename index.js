import app from "./src/app.js";
import connectDB from "./src/config/database.js";

// Handler for Vercel serverless functions
const handler = async (req, res) => {
  try {
    console.log(`\n🚀 ${req.method} ${req.url} - Starting request`);
    console.log(`🌐 Client IP: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);

    // Ensure database connection is established
    console.log("📡 Establishing database connection...");
    const connection = await connectDB();
    console.log(`✅ Database connection confirmed - State: ${connection.readyState}`);

    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error("❌ Handler error:", {
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
