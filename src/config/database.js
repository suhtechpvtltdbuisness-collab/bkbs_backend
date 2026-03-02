import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Configure mongoose for serverless - keep buffering ON but with timeout
mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", true);
mongoose.set("bufferTimeoutMS", 10000);

const connectDB = async () => {
  try {
    // Check if already connected (readyState 1 = connected)
    if (mongoose.connection.readyState === 1) {
      console.log("✅ Using existing MongoDB connection");
      // Verify connection is actually working
      await mongoose.connection.db.admin().ping();
      return mongoose.connection;
    }

    // If connecting (readyState 2), wait for it with timeout
    if (mongoose.connection.readyState === 2) {
      console.log("⏳ MongoDB connection in progress, waiting...");
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Connection wait timeout")),
          10000,
        );
        mongoose.connection.once("connected", () => {
          clearTimeout(timeout);
          console.log("✅ Connection established while waiting");
          resolve();
        });
        mongoose.connection.once("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
      return mongoose.connection;
    }

    console.log("🔌 Attempting MongoDB connection...");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set!");
    }

    console.log("📍 MongoDB URI configured");

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      connectTimeoutMS: 10000,
      family: 4, // Use IPv4, skip trying IPv6
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Connection state: ${mongoose.connection.readyState}`);

    // Verify connection with ping
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
    console.error("❌ MongoDB Connection Failed!");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error stack:", error.stack);

    // Log connection string format (without password)
    const sanitizedUri = process.env.MONGODB_URI
      ? process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")
      : "NOT SET";
    console.error("Connection string format:", sanitizedUri);

    // Don't exit in serverless environment
    if (process.env.VERCEL !== "1") {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

export default connectDB;
