import userRepository from "../repositories/userRepository.js";
import refreshTokenRepository from "../repositories/refreshTokenRepository.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpiration,
} from "../utils/jwt.js";
import { ApiError } from "../utils/apiResponse.js";
import { config } from "../config/env.js";
import { generateEmployeeId } from "../utils/idGenerator.js";

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    // Check if employeeId is provided and already exists
    if (userData.employeeId) {
      const existingEmployeeId = await userRepository.findByEmployeeId(
        userData.employeeId,
      );
      if (existingEmployeeId) {
        throw new ApiError(409, "Employee ID already exists");
      }
    } else {
      // Generate employeeId if not provided
      userData.employeeId = await generateEmployeeId();
    }

    // Create user
    const user = await userRepository.create(userData);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: user.getPublicProfile(),
      ...tokens,
    };
  }

  /**
   * Login user
   */
  async login(identifier, password, metadata = {}) {
    // Find user by email or employeeId
    const user = await userRepository.findByEmailOrEmployeeId(identifier);

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Check if user is deleted
    if (user.isDeleted) {
      throw new ApiError(403, "Account has been deleted");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Update last login
    await userRepository.updateLastLogin(user._id);

    // Generate tokens
    const tokens = await this.generateTokens(user, metadata);

    return {
      user: user.getPublicProfile(),
      ...tokens,
    };
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(user, metadata = {}) {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in database
    const expiresAt = new Date(
      Date.now() + getTokenExpiration(config.jwt.refreshExpire),
    );

    await refreshTokenRepository.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    // Check if token exists in database and is not revoked
    const tokenDoc = await refreshTokenRepository.findByToken(refreshToken);
    if (!tokenDoc) {
      throw new ApiError(401, "Refresh token not found or has been revoked");
    }

    // Get user
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.isDeleted) {
      throw new ApiError(403, "Account has been deleted");
    }

    // Generate new access token
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);

    return {
      accessToken,
    };
  }

  /**
   * Logout user
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await refreshTokenRepository.revokeToken(refreshToken);
    }
    return { message: "Logged out successfully" };
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId) {
    await refreshTokenRepository.revokeAllUserTokens(userId);
    return { message: "Logged out from all devices successfully" };
  }

  /**
   * Validate user credentials
   */
  async validateUser(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.isDeleted) {
      throw new ApiError(403, "Account has been deleted");
    }

    return user;
  }
}

export default new AuthService();
