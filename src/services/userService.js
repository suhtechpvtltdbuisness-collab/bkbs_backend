import mongoose from "mongoose";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import userRepository from "../repositories/userRepository.js";
import employeeRepository from "../repositories/employeeRepository.js";
import { ApiError } from "../utils/apiResponse.js";
import { generateEmployeeId } from "../utils/idGenerator.js";

class UserService {
  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updateData) {
    // Prevent updating sensitive fields
    const allowedUpdates = [
      "name",
      "contact",
      "email",
      "location",
      "workStartTime",
      "workEndTime",
    ];
    const filteredData = {};

    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const updatedUser = await userRepository.updateById(userId, filteredData);

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    return updatedUser;
  }

  /**
   * Update employee details (Admin only)
   */
  async updateEmployee(userId, updateData) {
    // Check if user exists and is employee/editor
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!["employee", "editor"].includes(user.role)) {
      throw new ApiError(400, "User is not an employee or editor");
    }

    // Prevent updating sensitive fields
    delete updateData.password;
    delete updateData.role;
    delete updateData.employeeId;
    delete updateData.createdBy;
    delete updateData._id;

    // Check if email is being updated and already exists
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await userRepository.findByEmail(updateData.email);
      if (existingUser) {
        throw new ApiError(409, "Email already exists");
      }
    }

    // Allowed fields for employee update
    const allowedUpdates = [
      "name",
      "email",
      "contact",
      "dateOfJoining",
      "location",
      "salary",
      "workStartTime",
      "workEndTime",
    ];

    const filteredData = {};
    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const updatedUser = await userRepository.updateById(userId, filteredData);

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    return updatedUser;
  }

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(filters, options) {
    return await userRepository.findAll(filters, options);
  }

  /**
   * Get user by ID (Admin only)
   */
  async getUserById(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(userId) {
    const user = await userRepository.deleteById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return { message: "User deleted successfully" };
  }

  /**
   * Update user status (Admin only)
   */
  async updateUserStatus(userId, isDeleted) {
    const user = await userRepository.updateById(userId, { isDeleted });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(userId, role) {
    const validRoles = ["user", "admin", "moderator", "employee", "editor"];

    if (!validRoles.includes(role)) {
      throw new ApiError(400, "Invalid role");
    }

    const user = await userRepository.updateById(userId, { role });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  /**
   * Create user with role employee or editor (Admin only)
   * Uses transaction to ensure both user and employee records are created atomically
   */
  async createUser(currentUser, userData) {
    // Validate role
    const allowedRoles = ["employee", "editor"];
    if (!allowedRoles.includes(userData.role)) {
      throw new ApiError(
        400,
        `Only 'employee' or 'editor' roles can be created. Provided: ${userData.role}`,
      );
    }

    // Check if current user is admin
    if (currentUser.role !== "admin") {
      throw new ApiError(403, "Only admins can create employee/editor users");
    }

    // Check if email already exists
    console.log("🔍 Checking if email exists:", userData.email);
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }
    console.log("✅ Email is unique");

    // Always generate unique employeeId automatically
    console.log("🔄 Generating employee ID...");
    userData.employeeId = await generateEmployeeId();
    console.log("✅ Generated employee ID:", userData.employeeId);

    // Safety check: verify generated employeeId is unique
    console.log("🔍 Verifying employee ID uniqueness...");
    const existingEmployeeId = await userRepository.findByEmployeeId(
      userData.employeeId,
    );
    if (existingEmployeeId) {
      throw new ApiError(
        409,
        "Employee ID generation conflict. Please try again.",
      );
    }
    console.log("✅ Employee ID is unique");

    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();

    let newUser;
    let newEmployee;

    try {
      // Start transaction
      await session.startTransaction();

      console.log("🔄 Starting transaction to create user and employee...");

      // Create user within transaction
      const userDoc = new User({
        ...userData,
        createdBy: currentUser.userId,
      });
      newUser = await userDoc.save({ session });
      console.log("✅ User created:", newUser._id);

      // Create employee record within transaction
      const employeeDoc = new Employee({
        userId: newUser._id,
        adminId: currentUser.userId,
      });
      newEmployee = await employeeDoc.save({ session });
      console.log("✅ Employee record created:", newEmployee._id);

      // Commit transaction
      await session.commitTransaction();
      console.log("✅ Transaction committed successfully");
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      console.error("❌ Transaction aborted:", error.message);
      throw new ApiError(500, `Failed to create user: ${error.message}`);
    } finally {
      // End session
      await session.endSession();
    }

    // Return user with employee relationship
    return {
      user: newUser.toObject(),
      employee: newEmployee.toObject(),
    };
  }

  /**
   * Soft delete user (Admin only)
   */
  async softDeleteUser(userId) {
    const user = await userRepository.updateById(userId, { isDeleted: true });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return { message: "User deleted successfully" };
  }
}

export default new UserService();
