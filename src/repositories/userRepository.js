import User from "../models/User.js";

class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findById(id) {
    return await User.findById(id).select("-password -refreshToken");
  }

  async findByIdWithPassword(id) {
    return await User.findById(id).select("+password");
  }

  async findByEmail(email) {
    return await User.findOne({ email }).select("+password +refreshToken");
  }

  async findByEmployeeId(employeeId) {
    return await User.findOne({ employeeId }).select("+password +refreshToken");
  }

  async findByEmailOrEmployeeId(identifier) {
    return await User.findOne({
      $or: [{ email: identifier }, { employeeId: identifier }],
    }).select("+password +refreshToken");
  }

  async findAll(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      select = "-password -refreshToken",
    } = options;

    const skip = (page - 1) * limit;

    const users = await User.find(filters)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filters);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password -refreshToken");
  }

  async updateRefreshToken(userId, refreshToken) {
    return await User.findByIdAndUpdate(
      userId,
      { $set: { refreshToken } },
      { new: true },
    );
  }

  async updateLastLogin(userId) {
    return await User.findByIdAndUpdate(
      userId,
      { $set: { lastLogin: new Date() } },
      { new: true },
    );
  }

  async deleteById(id) {
    return await User.findByIdAndDelete(id);
  }

  async exists(filter) {
    return await User.exists(filter);
  }

  async count(filter = {}) {
    return await User.countDocuments(filter);
  }
}

export default new UserRepository();
