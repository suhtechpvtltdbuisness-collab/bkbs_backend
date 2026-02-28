import userService from "../services/userService.js";
import { asyncHandler, successResponse } from "../utils/apiResponse.js";
import { paginate } from "../utils/helpers.js";

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.user.userId);

  successResponse(res, 200, "Profile retrieved successfully", { user });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateUserProfile(req.user.userId, req.body);

  successResponse(res, 200, "Profile updated successfully", { user });
});

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const { role, isActive } = req.query;

  const filters = {};
  if (role) filters.role = role;
  if (isActive !== undefined) filters.isActive = isActive === "true";

  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
  };

  const result = await userService.getAllUsers(filters, options);

  successResponse(res, 200, "Users retrieved successfully", result);
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin only)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  successResponse(res, 200, "User retrieved successfully", { user });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);

  successResponse(res, 200, "User deleted successfully", null);
});

/**
 * @desc    Update user status
 * @route   PATCH /api/users/:id/status
 * @access  Private (Admin only)
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await userService.updateUserStatus(req.params.id, isActive);

  successResponse(res, 200, "User status updated successfully", { user });
});

/**
 * @desc    Update user role
 * @route   PATCH /api/users/:id/role
 * @access  Private (Admin only)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await userService.updateUserRole(req.params.id, role);

  successResponse(res, 200, "User role updated successfully", { user });
});

export default {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserStatus,
  updateUserRole,
};
