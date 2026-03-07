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
 * Migration: Add unique indexes for contact and compound name fields
 * This ensures:
 * 1. Phone numbers (contact) are unique across all cards
 * 2. Name combinations (firstName, middleName, lastName) are unique
 */
const addCardUniqueIndexes = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n🔍 Current indexes in cards collection:");
    const currentIndexes = await Card.collection.indexes();
    currentIndexes.forEach((idx) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

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
    console.log("ℹ️  Contact numbers are now unique");
    console.log("ℹ️  Name combinations (firstName + middleName + lastName) are now unique");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    
    if (error.code === 11000) {
      console.error("\n⚠️  Duplicate key error detected!");
      console.error("This means you have duplicate data in your database.");
      console.error("Please clean up duplicate entries before running this migration:");
      console.error("1. Find cards with duplicate contact numbers");
      console.error("2. Find cards with duplicate name combinations");
      console.error("3. Remove or merge duplicate entries");
      console.error("\nYou can find duplicates with these queries:");
      console.error("  db.cards.aggregate([{$group: {_id: '$contact', count: {$sum: 1}}}, {$match: {count: {$gt: 1}}}])");
      console.error("  db.cards.aggregate([{$group: {_id: {firstName: '$firstName', middleName: '$middleName', lastName: '$lastName'}, count: {$sum: 1}}}, {$match: {count: {$gt: 1}}}])");
    }
    
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run migration
addCardUniqueIndexes()
  .then(() => {
    console.log("🎉 Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  });
