import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/database.js";
import Card from "../models/Card.js";

// Import migrations
import createAdminUser from "./001_create_admin_user.js";

dotenv.config();

// List all migrations in order
const migrations = [
  { name: "001_create_admin_user", migration: createAdminUser },
  {
    name: "002_sync_card_indexes",
    migration: {
      up: async () => {
        console.log("Running migration: Sync card indexes");
        await Card.syncIndexes();
        console.log("✅ Card indexes synced");
      },
      down: async () => {
        console.log("Skipping rollback for card index sync");
      },
    },
  },
];

/**
 * Run all migrations
 */
const runMigrations = async () => {
  try {
    console.log("🚀 Starting database migrations...\n");

    await connectDB();

    for (const { name, migration } of migrations) {
      console.log(`\n📝 Running migration: ${name}`);
      await migration.up();
    }

    console.log("\n✅ All migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
};

/**
 * Rollback all migrations
 */
const rollbackMigrations = async () => {
  try {
    console.log("🔄 Rolling back database migrations...\n");

    await connectDB();

    for (const { name, migration } of migrations.reverse()) {
      console.log(`\n📝 Rolling back migration: ${name}`);
      await migration.down();
    }

    console.log("\n✅ All migrations rolled back successfully");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Rollback failed:", error);
    process.exit(1);
  }
};

// Run migrations or rollback based on command
const command = process.argv[2];

if (command === "up") {
  runMigrations();
} else if (command === "down") {
  rollbackMigrations();
} else {
  console.log("Usage: node migrations/runner.js [up|down]");
  console.log("  up   - Run all migrations");
  console.log("  down - Rollback all migrations");
  process.exit(1);
}
