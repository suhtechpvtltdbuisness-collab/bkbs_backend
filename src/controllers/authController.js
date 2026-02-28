import authService from "../services/authService.js";
import { asyncHandler, successResponse } from "../utils/apiResponse.js";
import { getClientIp, getUserAgent } from "../utils/helpers.js";

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  const result = await authService.register({
    username,
    email,
    password,
    role,
  });

  // Set refresh token in httpOnly cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  successResponse(res, 201, "User registered successfully", {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const metadata = {
    userAgent: getUserAgent(req),
    ipAddress: getClientIp(req),
  };

  const result = await authService.login(email, password, metadata);

  // Set refresh token in httpOnly cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  successResponse(res, 200, "Login successful", {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const result = await authService.refreshAccessToken(refreshToken);

  successResponse(res, 200, "Access token refreshed successfully", {
    accessToken: result.accessToken,
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

  await authService.logout(refreshToken);

  // Clear refresh token cookie
  res.clearCookie("refreshToken");

  successResponse(res, 200, "Logout successful", null);
});

/**
 * @desc    Logout from all devices
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.userId);

  // Clear refresh token cookie
  res.clearCookie("refreshToken");

  successResponse(res, 200, "Logged out from all devices successfully", null);
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.validateUser(req.user.userId);

  successResponse(res, 200, "User retrieved successfully", {
    user: user.getPublicProfile(),
  });
});

export default {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getCurrentUser,
};
