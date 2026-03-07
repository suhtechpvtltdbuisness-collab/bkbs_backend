import Organization from "../models/Organization.js";

class OrganizationRepository {
  async create(organizationData) {
    const organization = new Organization(organizationData);
    return await organization.save();
  }

  async findById(id) {
    return await Organization.findById(id).populate("createdBy", "name email");
  }

  async findByRegistrationId(registrationId) {
    return await Organization.findOne({ registrationId, isDeleted: false });
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    const query = { ...filters, isDeleted: false };

    const organizations = await Organization.find(query)
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Organization.countDocuments(query);

    return {
      organizations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(id, updateData) {
    return await Organization.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("createdBy", "name email");
  }

  async deleteById(id) {
    return await Organization.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true },
    );
  }

  async hardDeleteById(id) {
    return await Organization.findByIdAndDelete(id);
  }

  async exists(filter) {
    return await Organization.exists(filter);
  }

  async count(filter = {}) {
    return await Organization.countDocuments({ ...filter, isDeleted: false });
  }
}

export default new OrganizationRepository();
