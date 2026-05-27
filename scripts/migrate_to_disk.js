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

const UPLOAD_BASE =
  process.env.UPLOAD_DIR || "/bkbs_docs/uploads";

console.log("=====================================");
console.log("MIGRATION SCRIPT STARTED");
console.log("=====================================");
console.log("UPLOAD_DIR ENV =", process.env.UPLOAD_DIR);
console.log("UPLOAD_BASE =", UPLOAD_BASE);

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

// Ensure base directory exists
await fs.mkdir(UPLOAD_BASE, { recursive: true });

// Test volume write
const testFile = path.join(
  UPLOAD_BASE,
  "migration-test.txt"
);

await fs.writeFile(
  testFile,
  "Railway volume working"
);

console.log("✅ Volume write test successful");

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

// Validate binary signatures
const validateFile = (buffer, mimetype) => {
  if (!buffer || buffer.length < 4) {
    return false;
  }

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
    return (
      buffer.toString("ascii", 0, 3) === "GIF"
    );
  }

  // WEBP
  if (mimetype.includes("webp")) {
    return (
      buffer.toString("ascii", 8, 12) ===
      "WEBP"
    );
  }

  // PDF
  if (mimetype.includes("pdf")) {
    return (
      buffer.toString("ascii", 0, 4) ===
      "%PDF"
    );
  }

  return true;
};

// Safe base64 parser
const parseBase64 = (base64String) => {
  try {
    if (
      !base64String ||
      typeof base64String !== "string"
    ) {
      return null;
    }

    if (!base64String.startsWith("data:")) {
      return null;
    }

    const commaIndex =
      base64String.indexOf(",");

    if (commaIndex === -1) {
      return null;
    }

    const meta = base64String.slice(
      0,
      commaIndex
    );

    const data = base64String.slice(
      commaIndex + 1
    );

    const mimeMatch = meta.match(
      /data:(.*?);base64/
    );

    if (!mimeMatch) {
      return null;
    }

    return {
      mimetype: mimeMatch[1],
      base64Data: data,
    };
  } catch (err) {
    return null;
  }
};

/*
|--------------------------------------------------------------------------
| MIGRATION
|--------------------------------------------------------------------------
*/

const migrate = async () => {
  try {
    console.log("\n=====================================");
    console.log("Connecting to MongoDB...");
    console.log("=====================================");

    await mongoose.connect(
      process.env.MONGODB_URI,
      {
        maxPoolSize: 5,
      }
    );

    console.log(
      "✅ MongoDB connected successfully!"
    );

    /*
    |--------------------------------------------------------------------------
    | CREATE CURSOR
    |--------------------------------------------------------------------------
    */

    console.log("\nCreating Mongo cursor...");

    const cursor = Card.find({
      "documents.path": {
        $regex: /^data:/,
      },
    })
      .select({
        documents: 1,
        firstName: 1,
        lastName: 1,
      })
      .cursor({
        batchSize: 1,
      });

    console.log(
      "✅ Cursor created successfully!"
    );

    /*
    |--------------------------------------------------------------------------
    | STATS
    |--------------------------------------------------------------------------
    */

    let cardCount = 0;
    let migratedDocsCount = 0;
    let failedDocsCount = 0;
    let skippedDocsCount = 0;
    let bytesSaved = 0;

    /*
    |--------------------------------------------------------------------------
    | PROCESS STREAM
    |--------------------------------------------------------------------------
    */

    for await (const card of cursor) {
      cardCount++;

      console.log(
        `\n=====================================`
      );

      console.log(
        `[CARD ${cardCount}] ${
          card.firstName || ""
        } ${card.lastName || ""}`
      );

      console.log(
        `=====================================`
      );

      let needsUpdate = false;

      /*
      |--------------------------------------------------------------------------
      | DOCUMENT LOOP
      |--------------------------------------------------------------------------
      */

      for (const doc of card.documents) {
        try {
          // Skip already migrated docs
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

          const parsed = parseBase64(
            doc.path
          );

          if (!parsed) {
            console.log(
              `❌ Invalid base64 -> ${doc._id}`
            );

            failedDocsCount++;
            continue;
          }

          const {
            mimetype,
            base64Data,
          } = parsed;

          /*
          |--------------------------------------------------------------------------
          | CREATE BUFFER
          |--------------------------------------------------------------------------
          */

          const buffer = Buffer.from(
            base64Data,
            "base64"
          );

          if (
            !buffer ||
            buffer.length === 0
          ) {
            console.log(
              `❌ Empty buffer -> ${doc._id}`
            );

            failedDocsCount++;
            continue;
          }

          /*
          |--------------------------------------------------------------------------
          | VALIDATE FILE
          |--------------------------------------------------------------------------
          */

          const isValid = validateFile(
            buffer,
            mimetype
          );

          if (!isValid) {
            console.log(
              `❌ Corrupted file -> ${doc._id}`
            );

            failedDocsCount++;
            continue;
          }

          /*
          |--------------------------------------------------------------------------
          | FILE PATHS
          |--------------------------------------------------------------------------
          */

          const ext =
            getExtension(mimetype);

          const year = doc.uploadedAt
            ? new Date(
                doc.uploadedAt
              ).getFullYear()
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
            .replace(
              /[^a-zA-Z0-9-_]/g,
              "_"
            )
            .slice(0, 50);

          const filename = `${Date.now()}_${
            doc._id
          }_${sanitizedName}${ext}`;

          const absolutePath =
            path.join(
              yearDir,
              filename
            );

          const relativePath = `/uploads/${year}/${filename}`;

          /*
          |--------------------------------------------------------------------------
          | WRITE FILE
          |--------------------------------------------------------------------------
          */

          console.log(
            `Writing file -> ${absolutePath}`
          );

          await fs.writeFile(
            absolutePath,
            buffer
          );

          console.log(
            `✅ File written successfully`
          );

          /*
          |--------------------------------------------------------------------------
          | UPDATE DOC
          |--------------------------------------------------------------------------
          */

          doc.path = relativePath;
          doc.mimetype = mimetype;
          doc.size = buffer.length;

          needsUpdate = true;

          migratedDocsCount++;

          bytesSaved += buffer.length;

          console.log(
            `✅ Migrated -> ${filename}`
          );

          console.log(
            `Size -> ${(
              buffer.length / 1024
            ).toFixed(2)} KB`
          );

          console.log(
            `URL -> ${relativePath}`
          );
        } catch (docErr) {
          failedDocsCount++;

          console.log(
            `❌ Failed -> ${doc._id}`
          );

          console.log(docErr);
        }
      }

      /*
      |--------------------------------------------------------------------------
      | SAVE CARD
      |--------------------------------------------------------------------------
      */

      if (needsUpdate) {
        try {
          card.markModified(
            "documents"
          );

          await card.save();

          console.log(
            "💾 Card updated successfully!"
          );
        } catch (saveErr) {
          console.log(
            "❌ Failed saving card"
          );

          console.log(saveErr);
        }
      }

      /*
      |--------------------------------------------------------------------------
      | MEMORY CLEANUP
      |--------------------------------------------------------------------------
      */

      global.gc?.();
    }

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    console.log("\n=====================================");
    console.log("MIGRATION COMPLETED");
    console.log("=====================================");

    console.log(
      `Cards Processed -> ${cardCount}`
    );

    console.log(
      `Migrated Docs -> ${migratedDocsCount}`
    );

    console.log(
      `Failed Docs -> ${failedDocsCount}`
    );

    console.log(
      `Skipped Docs -> ${skippedDocsCount}`
    );

    console.log(
      `Disk Used -> ${(
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

    console.log(
      "MongoDB connection closed."
    );

    process.exit(0);
  } catch (err) {
    console.error(
      "\n====================================="
    );

    console.error(
      "FATAL MIGRATION ERROR"
    );

    console.error(
      "====================================="
    );

    console.error(err);

    process.exit(1);
  }
};

migrate();