import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Configure mongoose for serverless - keep buffering ON but with timeout
mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", true);
mongoose.set("bufferTimeoutMS", 10000);

const connectDB = async () => {
  // Check if already connected (readyState 1 = connected)
  if (mongoose.connection.readyState === 1) {
    console.log("✅ Using existing MongoDB connection");
    return mongoose.connection;
  }

  // If connecting (readyState 2), wait for it with timeout
  if (mongoose.connection.readyState === 2) {
    console.log("⏳ MongoDB connection in progress, waiting...");
    return Promise.race([
      new Promise((resolve, reject) => {
        mongoose.connection.once("connected", () => {
          console.log("✅ Connection established while waiting");
          resolve(mongoose.connection);
        });
        mongoose.connection.once("error", reject);
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Connection wait timeout")), 10000)
      )
    ]);
  }

  try {
    console.log("🔌 Attempting MongoDB connection...");
    console.log("📍 MongoDB URI:", process.env.MONGODB_URI ? "Set" : "NOT SET");
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 10000,
      maxPoolSize: 1,
      minPoolSize: 0,
      maxIdleTimeMS: 10000,
      connectTimeoutMS: 8000,
      family: 4, // Use IPv4, skip trying IPv6
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Connection state: ${mongoose.connection.readyState}`);

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
