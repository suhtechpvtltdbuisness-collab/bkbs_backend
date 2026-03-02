import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../.env") });

/**
 * Migration: Drop username_1 index from users collection
 * This index is from an old schema and causes duplicate key errors
 */
const dropUsernameIndex = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    console.log("📍 URI:", process.env.MONGODB_URI ? "Configured" : "NOT SET");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    console.log("🔍 Checking existing indexes...");
    const indexes = await usersCollection.indexes();
    console.log("All indexes:");
    indexes.forEach((idx) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    // Check if username_1 index exists
    const usernameIndexExists = indexes.some(
      (idx) => idx.name === "username_1",
    );

    if (usernameIndexExists) {
      console.log("🗑️  Dropping username_1 index...");
      await usersCollection.dropIndex("username_1");
      console.log("✅ Successfully dropped username_1 index");
    } else {
      console.log("ℹ️  username_1 index does not exist");

      // Check for any username-related keys in compound indexes
      const usernameInCompound = indexes.filter(
        (idx) => idx.key && Object.keys(idx.key).includes("username"),
      );

      if (usernameInCompound.length > 0) {
        console.log("⚠️  Found username in these indexes:");
        usernameInCompound.forEach((idx) => {
          console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
          console.log(`    Attempting to drop ${idx.name}...`);
          try {
            usersCollection.dropIndex(idx.name);
            console.log(`    ✅ Dropped ${idx.name}`);
          } catch (err) {
            console.error(`    ❌ Failed to drop ${idx.name}:`, err.message);
          }
        });
      }
    }

    console.log("\n🔍 Updated indexes:");
    const updatedIndexes = await usersCollection.indexes();
    updatedIndexes.forEach((idx) => {
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
dropUsernameIndex()
  .then(() => {
    console.log("🎉 Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  });
