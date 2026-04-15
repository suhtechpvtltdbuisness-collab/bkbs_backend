import Camp from "../models/Camp.js";

class CampRepository {
  async create(campData) {
    const camp = new Camp(campData);
    return await camp.save();
  }

  async findById(id) {
    return await Camp.findById(id).populate("createdBy", "name email role");
  }

  async findAll(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = { date: -1, createdAt: -1 },
    } = options;
    const skip = (page - 1) * limit;
    const query = { ...filters, isDeleted: false };

    const camps = await Camp.find(query)
      .populate("createdBy", "name email role")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Camp.countDocuments(query);

    return {
      camps,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(id, updateData) {
    return await Camp.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("createdBy", "name email role");
  }

  async softDeleteById(id) {
    return await Camp.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true },
    );
  }
}

export default new CampRepository();
