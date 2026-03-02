import app from "./src/app.js";
import connectDB from "./src/config/database.js";

// Handler for Vercel serverless functions
const handler = async (req, res) => {
  try {
    console.log(`${req.method} ${req.url} - Starting request`);

    // Ensure database connection is established
    await connectDB();
    console.log("Database connection confirmed");

    // Pass request to Express app
    return app(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Export the handler for Vercel
export default handler;
