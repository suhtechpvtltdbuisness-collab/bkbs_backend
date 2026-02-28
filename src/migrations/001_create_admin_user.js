import User from "../models/User.js";

/**
 * Migration to create initial admin user
 */
export const up = async () => {
  console.log("Running migration: Create initial admin user");

  const adminExists = await User.findOne({ email: "admin@example.com" });

  if (!adminExists) {
    await User.create({
      name: "System Administrator",
      email: "admin@example.com",
      password: "Admin@123",
      role: "admin",
      isAdmin: true,
      employeeId: "ADMIN001",
    });
    console.log("✅ Admin user created successfully");
  } else {
    console.log("ℹ️  Admin user already exists");
  }
};

/**
 * Rollback migration
 */
export const down = async () => {
  console.log("Rolling back migration: Remove admin user");
  await User.deleteOne({ email: "admin@example.com" });
  console.log("✅ Admin user removed");
};

export default { up, down };
