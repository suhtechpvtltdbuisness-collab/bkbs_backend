import Partner from "../models/Partner.js";

class PartnerRepository {
  async create(partnerData) {
    const partner = new Partner(partnerData);
    return await partner.save();
  }

  async findById(id) {
    return await Partner.findById(id).populate("createdBy");
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    const query = { ...filters, isDeleted: false };

    const partners = await Partner.find(query)
      .populate("createdBy")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Partner.countDocuments(query);

    return {
      partners,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(id, updateData) {
    return await Partner.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("createdBy");
  }

  async softDeleteById(id) {
    return await Partner.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true },
    );
  }

  async deleteById(id) {
    return await Partner.findByIdAndDelete(id);
  }

  async exists(filter) {
    return await Partner.exists(filter);
  }

  async count(filter = {}) {
    return await Partner.countDocuments({ ...filter, isDeleted: false });
  }

  async search(searchTerm, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    const query = {
      isDeleted: false,
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { specialty: { $regex: searchTerm, $options: "i" } },
        { location: { $regex: searchTerm, $options: "i" } },
      ],
    };

    const partners = await Partner.find(query)
      .populate("createdBy")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Partner.countDocuments(query);

    return {
      partners,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findByLocation(location, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    const partners = await Partner.find({
      location,
      isDeleted: false,
    })
      .populate("createdBy")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Partner.countDocuments({ location, isDeleted: false });

    return {
      partners,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export default new PartnerRepository();
