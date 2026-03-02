import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Configure mongoose globally for serverless
mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);
mongoose.set("bufferTimeoutMS", 30000);

const connectDB = async () => {
  // Check if already connected (readyState 1 = connected)
  if (mongoose.connection.readyState === 1) {
    console.log("Using existing MongoDB connection");
    return mongoose.connection;
  }

  // If connecting (readyState 2), wait for it
  if (mongoose.connection.readyState === 2) {
    console.log("MongoDB connection in progress, waiting...");
    return new Promise((resolve, reject) => {
      mongoose.connection.once("connected", () => resolve(mongoose.connection));
      mongoose.connection.once("error", reject);
    });
  }

  try {
    console.log("Attempting MongoDB connection...");
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 8000,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      connectTimeoutMS: 8000,
      family: 4, // Use IPv4, skip trying IPv6
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Test the connection with a simple operation
    await mongoose.connection.db.admin().ping();
    console.log("✅ MongoDB Ping successful");

    // Handle connection events (only in non-serverless env)
    if (process.env.VERCEL !== "1") {
      mongoose.connection.on("error", (err) => {
        console.error(`❌ MongoDB connection error: ${err}`);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("⚠️  MongoDB disconnected");
      });

      // Graceful shutdown (not needed in serverless)
      process.on("SIGINT", async () => {
        await mongoose.connection.close();
        console.log("MongoDB connection closed through app termination");
        process.exit(0);
      });
    }

    return conn.connection;
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);

    // Don't exit in serverless environment
    if (process.env.VERCEL !== "1") {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

export default connectDB;
