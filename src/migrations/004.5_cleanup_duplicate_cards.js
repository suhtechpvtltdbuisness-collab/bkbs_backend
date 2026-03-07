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
 * Script to find and clean up duplicate cards
 * Duplicates are based on:
 * 1. Contact number (phone)
 * 2. Name combination (firstName + middleName + lastName)
 */
const findAndCleanupDuplicates = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find duplicate contacts
    console.log("🔍 Finding duplicate contact numbers...");
    const duplicateContacts = await Card.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: "$contact",
          count: { $sum: 1 },
          cards: {
            $push: {
              id: "$_id",
              applicationId: "$applicationId",
              firstName: "$firstName",
              middleName: "$middleName",
              lastName: "$lastName",
              createdAt: "$createdAt",
            },
          },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ]);

    if (duplicateContacts.length > 0) {
      console.log(`\n⚠️  Found ${duplicateContacts.length} duplicate contact numbers:\n`);
      
      for (const dup of duplicateContacts) {
        console.log(`📞 Contact: ${dup._id} (${dup.count} cards)`);
        dup.cards.forEach((card, index) => {
          console.log(
            `   ${index + 1}. ID: ${card.id} | App ID: ${card.applicationId} | Name: ${card.firstName} ${card.middleName || ""} ${card.lastName || ""} | Created: ${card.createdAt}`,
          );
        });
        console.log("");
      }

      console.log("🗑️  Keeping the oldest card for each duplicate, marking others as deleted...\n");

      for (const dup of duplicateContacts) {
        // Sort by createdAt, keep the oldest one
        const sortedCards = dup.cards.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );

        // Mark all except the first (oldest) as deleted
        for (let i = 1; i < sortedCards.length; i++) {
          await Card.findByIdAndUpdate(sortedCards[i].id, {
            isDeleted: true,
          });
          console.log(
            `   ✓ Marked as deleted: ${sortedCards[i].applicationId} (${sortedCards[i].firstName} ${sortedCards[i].middleName || ""} ${sortedCards[i].lastName || ""})`,
          );
        }
        console.log(
          `   ✓ Kept: ${sortedCards[0].applicationId} (${sortedCards[0].firstName} ${sortedCards[0].middleName || ""} ${sortedCards[0].lastName || ""})\n`,
        );
      }
    } else {
      console.log("✓ No duplicate contact numbers found");
    }

    // Find duplicate names
    console.log("\n🔍 Finding duplicate name combinations...");
    const duplicateNames = await Card.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: {
            firstName: "$firstName",
            middleName: { $ifNull: ["$middleName", ""] },
            lastName: { $ifNull: ["$lastName", ""] },
          },
          count: { $sum: 1 },
          cards: {
            $push: {
              id: "$_id",
              applicationId: "$applicationId",
              contact: "$contact",
              createdAt: "$createdAt",
            },
          },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ]);

    if (duplicateNames.length > 0) {
      console.log(`\n⚠️  Found ${duplicateNames.length} duplicate name combinations:\n`);

      for (const dup of duplicateNames) {
        console.log(
          `👤 Name: ${dup._id.firstName} ${dup._id.middleName} ${dup._id.lastName} (${dup.count} cards)`,
        );
        dup.cards.forEach((card, index) => {
          console.log(
            `   ${index + 1}. ID: ${card.id} | App ID: ${card.applicationId} | Contact: ${card.contact} | Created: ${card.createdAt}`,
          );
        });
        console.log("");
      }

      console.log("🗑️  Keeping the oldest card for each duplicate, marking others as deleted...\n");

      for (const dup of duplicateNames) {
        // Sort by createdAt, keep the oldest one
        const sortedCards = dup.cards.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );

        // Mark all except the first (oldest) as deleted
        for (let i = 1; i < sortedCards.length; i++) {
          const card = await Card.findById(sortedCards[i].id);
          if (card && !card.isDeleted) {
            await Card.findByIdAndUpdate(sortedCards[i].id, {
              isDeleted: true,
            });
            console.log(
              `   ✓ Marked as deleted: ${sortedCards[i].applicationId} (Contact: ${sortedCards[i].contact})`,
            );
          }
        }
        console.log(
          `   ✓ Kept: ${sortedCards[0].applicationId} (Contact: ${sortedCards[0].contact})\n`,
        );
      }
    } else {
      console.log("✓ No duplicate name combinations found");
    }

    console.log("\n✅ Duplicate cleanup completed!");
    console.log("ℹ️  You can now run the index migration: node src/migrations/005_add_card_unique_indexes.js");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Disconnected from MongoDB");
  }
};

// Run cleanup
findAndCleanupDuplicates()
  .then(() => {
    console.log("🎉 Cleanup script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Cleanup script failed:", error);
    process.exit(1);
  });
