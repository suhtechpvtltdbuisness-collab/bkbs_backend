import app from "./src/app.js";
import connectDB from "./src/config/database.js";

// Connect to database (with connection pooling for serverless)
connectDB().catch((err) => {
  console.error("Failed to connect to database:", err);
});

// Export the Express app as a Vercel serverless function
export default app;
