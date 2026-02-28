import RefreshToken from "../models/RefreshToken.js";

class RefreshTokenRepository {
  async create(tokenData) {
    const refreshToken = new RefreshToken(tokenData);
    return await refreshToken.save();
  }

  async findByToken(token) {
    return await RefreshToken.findOne({ token, isRevoked: false });
  }

  async findByUserId(userId) {
    return await RefreshToken.find({ userId, isRevoked: false });
  }

  async revokeToken(token) {
    return await RefreshToken.findOneAndUpdate(
      { token },
      { $set: { isRevoked: true } },
      { new: true },
    );
  }

  async revokeAllUserTokens(userId) {
    return await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { $set: { isRevoked: true } },
    );
  }

  async deleteExpiredTokens() {
    return await RefreshToken.deleteMany({
      expiresAt: { $lt: new Date() },
    });
  }

  async deleteByToken(token) {
    return await RefreshToken.deleteOne({ token });
  }

  async deleteAllUserTokens(userId) {
    return await RefreshToken.deleteMany({ userId });
  }

  async countUserTokens(userId) {
    return await RefreshToken.countDocuments({ userId, isRevoked: false });
  }
}

export default new RefreshTokenRepository();
