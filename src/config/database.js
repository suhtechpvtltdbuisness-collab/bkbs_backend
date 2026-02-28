import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

const connectDB = async () => {
  // Use existing connection if available (for serverless)
  if (isConnected) {
    console.log("Using existing MongoDB connection");
    return;
  }

  try {
    // Configure mongoose for serverless
    mongoose.set("strictQuery", true);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events (only in non-serverless env)
    if (process.env.VERCEL !== "1") {
      mongoose.connection.on("error", (err) => {
        console.error(`❌ MongoDB connection error: ${err}`);
        isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        console.log("⚠️  MongoDB disconnected");
        isConnected = false;
      });

      // Graceful shutdown (not needed in serverless)
      process.on("SIGINT", async () => {
        await mongoose.connection.close();
        console.log("MongoDB connection closed through app termination");
        process.exit(0);
      });
    }
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    isConnected = false;

    // Don't exit in serverless environment
    if (process.env.VERCEL !== "1") {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

export default connectDB;
