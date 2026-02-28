import Hospital from "../models/Hospital.js";

class HospitalRepository {
  async create(hospitalData) {
    const hospital = new Hospital(hospitalData);
    return await hospital.save();
  }

  async findById(id) {
    return await Hospital.findById(id).populate("createdBy");
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    const query = { ...filters, isDeleted: false };

    const hospitals = await Hospital.find(query)
      .populate("createdBy")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Hospital.countDocuments(query);

    return {
      hospitals,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(id, updateData) {
    return await Hospital.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("createdBy");
  }

  async softDeleteById(id) {
    return await Hospital.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true },
    );
  }

  async deleteById(id) {
    return await Hospital.findByIdAndDelete(id);
  }

  async exists(filter) {
    return await Hospital.exists(filter);
  }

  async count(filter = {}) {
    return await Hospital.countDocuments({ ...filter, isDeleted: false });
  }

  async search(searchTerm, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    const query = {
      isDeleted: false,
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { address: { $regex: searchTerm, $options: "i" } },
      ],
    };

    const hospitals = await Hospital.find(query)
      .populate("createdBy")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Hospital.countDocuments(query);

    return {
      hospitals,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export default new HospitalRepository();
