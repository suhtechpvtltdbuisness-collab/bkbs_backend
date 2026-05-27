import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import Card from "../src/models/Card.js";

dotenv.config();

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

// Railway mounted volume example:
// /bkbs_docs/uploads
const UPLOAD_BASE =
  process.env.UPLOAD_DIR || "/bkbs_docs/uploads";

// Ensure uploads base exists
await fs.mkdir(UPLOAD_BASE, { recursive: true });

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

// Mime type -> extension
const getExtension = (mimetype = "") => {
  const map = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
  };

  return map[mimetype] || ".bin";
};

// Validate magic bytes
const validateFile = (buffer, mimetype) => {
  if (!buffer || buffer.length < 4) return false;

  const hex = buffer.toString("hex", 0, 4);

  // JPEG
  if (
    mimetype.includes("jpeg") ||
    mimetype.includes("jpg")
  ) {
    return hex.startsWith("ffd8");
  }

  // PNG
  if (mimetype.includes("png")) {
    return hex === "89504e47";
  }

  // GIF
  if (mimetype.includes("gif")) {
    return buffer.toString("ascii", 0, 3) === "GIF";
  }

  // WEBP
  if (mimetype.includes("webp")) {
    return (
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }

  // PDF
  if (mimetype.includes("pdf")) {
    return (
      buffer.toString("ascii", 0, 4) === "%PDF"
    );
  }

  return true;
};

// Extract base64 safely
const parseBase64 = (base64String) => {
  if (
    !base64String ||
    typeof base64String !== "string"
  ) {
    return null;
  }

  if (!base64String.startsWith("data:")) {
    return null;
  }

  const commaIndex = base64String.indexOf(",");

  if (commaIndex === -1) {
    return null;
  }

  const meta = base64String.slice(0, commaIndex);
  const data = base64String.slice(commaIndex + 1);

  const mimeMatch = meta.match(/data:(.*?);base64/);

  if (!mimeMatch) {
    return null;
  }

  return {
    mimetype: mimeMatch[1],
    base64Data: data,
  };
};

/*
|--------------------------------------------------------------------------
| MIGRATION
|--------------------------------------------------------------------------
*/

const migrate = async () => {
  try {
    console.log("=====================================");
    console.log("Starting Migration...");
    console.log("=====================================");

    /*
    |--------------------------------------------------------------------------
    | DATABASE CONNECT
    |--------------------------------------------------------------------------
    */

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully!");

    /*
    |--------------------------------------------------------------------------
    | FIND CARDS
    |--------------------------------------------------------------------------
    */

    const cards = await Card.find({
      "documents.path": {
        $regex: /^data:/,
      },
    });

    console.log(
      `Found ${cards.length} cards requiring migration.\n`
    );

    /*
    |--------------------------------------------------------------------------
    | STATS
    |--------------------------------------------------------------------------
    */

    let migratedDocsCount = 0;
    let failedDocsCount = 0;
    let skippedDocsCount = 0;
    let bytesSaved = 0;

    /*
    |--------------------------------------------------------------------------
    | PROCESS CARDS
    |--------------------------------------------------------------------------
    */

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      let needsUpdate = false;

      console.log(
        `\n[${i + 1}/${cards.length}] Card: ${
          card.firstName || ""
        } ${card.lastName || ""}`
      );

      for (const doc of card.documents) {
        try {
          /*
          |--------------------------------------------------------------------------
          | SKIP NON-BASE64
          |--------------------------------------------------------------------------
          */

          if (
            !doc.path ||
            typeof doc.path !== "string" ||
            !doc.path.startsWith("data:")
          ) {
            skippedDocsCount++;
            continue;
          }

          /*
          |--------------------------------------------------------------------------
          | PARSE BASE64
          |--------------------------------------------------------------------------
          */

          const parsed = parseBase64(doc.path);

          if (!parsed) {
            console.log(
              `  ❌ Invalid base64 format -> ${doc._id}`
            );

            failedDocsCount++;
            continue;
          }

          const { mimetype, base64Data } = parsed;

          /*
          |--------------------------------------------------------------------------
          | CREATE BUFFER
          |--------------------------------------------------------------------------
          */

          const buffer = Buffer.from(
            base64Data,
            "base64"
          );

          if (!buffer || buffer.length === 0) {
            console.log(
              `  ❌ Empty buffer -> ${doc._id}`
            );

            failedDocsCount++;
            continue;
          }

          /*
          |--------------------------------------------------------------------------
          | VALIDATE FILE SIGNATURE
          |--------------------------------------------------------------------------
          */

          const isValid = validateFile(
            buffer,
            mimetype
          );

          if (!isValid) {
            console.log(
              `  ❌ Corrupted file detected -> ${doc._id}`
            );

            failedDocsCount++;
            continue;
          }

          /*
          |--------------------------------------------------------------------------
          | FILE PATHS
          |--------------------------------------------------------------------------
          */

          const ext = getExtension(mimetype);

          const year = doc.uploadedAt
            ? new Date(doc.uploadedAt).getFullYear()
            : new Date().getFullYear();

          const yearDir = path.join(
            UPLOAD_BASE,
            String(year)
          );

          await fs.mkdir(yearDir, {
            recursive: true,
          });

          const sanitizedName = (
            doc.name || "document"
          )
            .replace(/[^a-zA-Z0-9-_]/g, "_")
            .slice(0, 50);

          const filename = `${Date.now()}_${
            doc._id
          }_${sanitizedName}${ext}`;

          const absolutePath = path.join(
            yearDir,
            filename
          );

          /*
          |--------------------------------------------------------------------------
          | SAVE FILE
          |--------------------------------------------------------------------------
          */

          await fs.writeFile(
            absolutePath,
            buffer
          );

          /*
          |--------------------------------------------------------------------------
          | UPDATE DB
          |--------------------------------------------------------------------------
          */

          // URL accessible path
          const relativePath = `/uploads/${year}/${filename}`;

          doc.path = relativePath;
          doc.mimetype = mimetype;
          doc.size = buffer.length;

          needsUpdate = true;

          migratedDocsCount++;

          bytesSaved += buffer.length;

          console.log(
            `  ✅ Migrated: ${filename}`
          );

          console.log(
            `     Size: ${(
              buffer.length / 1024
            ).toFixed(2)} KB`
          );

          console.log(
            `     URL: ${relativePath}`
          );
        } catch (docErr) {
          failedDocsCount++;

          console.log(
            `  ❌ Migration failed -> ${doc._id}`
          );

          console.log(docErr.message);
        }
      }

      /*
      |--------------------------------------------------------------------------
      | SAVE CARD
      |--------------------------------------------------------------------------
      */

      if (needsUpdate) {
        card.markModified("documents");

        await card.save();

        console.log(
          "  💾 Card updated successfully!"
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    console.log("\n=====================================");
    console.log("Migration Completed!");
    console.log("=====================================");

    console.log(
      `✅ Migrated Documents: ${migratedDocsCount}`
    );

    console.log(
      `❌ Failed Documents: ${failedDocsCount}`
    );

    console.log(
      `⏭️ Skipped Documents: ${skippedDocsCount}`
    );

    console.log(
      `💾 Disk Storage Used: ${(
        bytesSaved /
        (1024 * 1024)
      ).toFixed(2)} MB`
    );

    console.log("=====================================");

    /*
    |--------------------------------------------------------------------------
    | CLOSE DB
    |--------------------------------------------------------------------------
    */

    await mongoose.connection.close();

    console.log("MongoDB connection closed.");

    process.exit(0);
  } catch (err) {
    console.error("\n=====================================");
    console.error("FATAL MIGRATION ERROR");
    console.error("=====================================");
    console.error(err);

    process.exit(1);
  }
};

migrate();