import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

/**
 * Migration: Sync indexes - drop old indexes and recreate from current model
 */
const syncIndexes = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n🔍 Current indexes in database:");
    const currentIndexes = await User.collection.indexes();
    currentIndexes.forEach((idx) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    console.log("\n🗑️  Dropping all indexes except _id_...");
    await User.collection.dropIndexes();
    console.log("✅ All indexes dropped");

    console.log("\n🔨 Creating indexes from current model...");
    await User.syncIndexes();
    console.log("✅ Indexes synced from model");

    console.log("\n🔍 New indexes:");
    const newIndexes = await User.collection.indexes();
    newIndexes.forEach((idx) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run migration
syncIndexes()
  .then(() => {
    console.log("🎉 Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  });
