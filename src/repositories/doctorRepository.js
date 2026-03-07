import Doctor from "../models/Doctor.js";

class DoctorRepository {
  async create(doctorData) {
    const doctor = new Doctor(doctorData);
    return await doctor.save();
  }

  async findById(id) {
    return await Doctor.findById(id)
      .populate("organizationId", "registrationId partnerId")
      .populate("createdBy", "name email");
  }

  async findByOrganizationId(organizationId, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    const query = { organizationId, isDeleted: false };

    const doctors = await Doctor.find(query)
      .populate("organizationId", "registrationId partnerId")
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Doctor.countDocuments(query);

    return {
      doctors,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    const query = { ...filters, isDeleted: false };

    const doctors = await Doctor.find(query)
      .populate("organizationId", "registrationId partnerId")
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Doctor.countDocuments(query);

    return {
      doctors,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(id, updateData) {
    return await Doctor.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    )
      .populate("organizationId", "registrationId partnerId")
      .populate("createdBy", "name email");
  }

  async deleteById(id) {
    return await Doctor.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true },
    );
  }

  async hardDeleteById(id) {
    return await Doctor.findByIdAndDelete(id);
  }

  async exists(filter) {
    return await Doctor.exists(filter);
  }

  async count(filter = {}) {
    return await Doctor.countDocuments({ ...filter, isDeleted: false });
  }
}

export default new DoctorRepository();
