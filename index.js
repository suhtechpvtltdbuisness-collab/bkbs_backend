import app from "./src/app.js";
import connectDB from "./src/config/database.js";

// Connect to database with error handling for serverless
let dbConnected = false;

// Handler for Vercel serverless functions
const handler = async (req, res) => {
  try {
    // Establish database connection if not already connected
    if (!dbConnected) {
      await connectDB();
      dbConnected = true;
    }

    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Export the handler for Vercel
export default handler;
