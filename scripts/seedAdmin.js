import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../src/config/database.js";
import User from "../src/models/User.js";

dotenv.config();

/**
 * Seed Admin User Script
 * Creates an admin user in the database
 * Can be customized via environment variables
 */

const seedAdmin = async () => {
  try {
    console.log("🌱 Starting admin user seed script...\n");

    // Connect to database
    await connectDB();
    console.log("✅ Database connected\n");

    // Admin user configuration
    const adminData = {
      name: process.env.ADMIN_NAME || "Admin User",
      email: process.env.ADMIN_EMAIL || "admin@bkbs.com",
      password: process.env.ADMIN_PASSWORD || "Admin@123",
      role: "admin",
      isAdmin: true,
      employeeId: process.env.ADMIN_EMPLOYEE_ID || "ADMIN001",
      contact: process.env.ADMIN_CONTACT || "",
      location: process.env.ADMIN_LOCATION || "",
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });

    if (existingAdmin) {
      console.log("ℹ️  Admin user already exists:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Employee ID: ${existingAdmin.employeeId}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);
      console.log("\n⚠️  Skipping creation to avoid duplicates");
      console.log(
        "   Tip: Delete existing admin or use a different email to create a new one\n",
      );
    } else {
      // Create admin user (password will be hashed by pre-save hook)
      const admin = await User.create(adminData);

      console.log("✅ Admin user created successfully!\n");
      console.log("📋 Admin Details:");
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Employee ID: ${admin.employeeId}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Admin Status: ${admin.isAdmin}`);
      console.log(
        `   Password: ${adminData.password} (store this securely!)\n`,
      );
      console.log(
        "🔐 Password has been hashed and stored securely in the database",
      );
    }

    // Close database connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding admin user:", error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed script
seedAdmin();
