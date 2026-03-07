import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Card from "../models/Card.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

/**
 * Migration: Sync Card indexes - drop old indexes and recreate from current model
 * This fixes the "applicantId already exists" error by removing outdated indexes
 */
const syncCardIndexes = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n🔍 Current indexes in cards collection:");
    const currentIndexes = await Card.collection.indexes();
    currentIndexes.forEach((idx) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    // Check for applicantId index (old field name)
    const hasApplicantIdIndex = currentIndexes.some(
      (idx) => idx.key && Object.keys(idx.key).includes("applicantId"),
    );

    if (hasApplicantIdIndex) {
      console.log(
        "⚠️  Found old 'applicantId' index - this needs to be removed",
      );
    }

    console.log("\n🗑️  Dropping all indexes except _id_...");
    await Card.collection.dropIndexes();
    console.log("✅ All indexes dropped");

    console.log("\n🔨 Creating indexes from current Card model...");
    await Card.syncIndexes();
    console.log("✅ Indexes synced from model");

    console.log("\n🔍 New indexes:");
    const newIndexes = await Card.collection.indexes();
    newIndexes.forEach((idx) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    console.log("\n✅ Migration completed successfully!");
    console.log(
      "ℹ️  The 'applicantId already exists' error should now be resolved",
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run migration
syncCardIndexes()
  .then(() => {
    console.log("🎉 Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  });
