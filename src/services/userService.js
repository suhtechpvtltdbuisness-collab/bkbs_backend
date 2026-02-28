import userRepository from "../repositories/userRepository.js";
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
    const validRoles = ["user", "admin", "moderator", "employee"];

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
   * Create user (Admin only)
   */
  async createUser(userData) {
    // Generate employeeId if not provided
    if (!userData.employeeId) {
      userData.employeeId = await generateEmployeeId();
    }

    const user = await userRepository.create(userData);
    return user;
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
