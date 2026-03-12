import Donation from "../models/Donation.js";

class DonationRepository {
  async create(donationData) {
    const donation = new Donation(donationData);
    return await donation.save();
  }

  async findById(id) {
    return await Donation.findById(id);
  }

  async findByEnquiryId(enquiryId) {
    return await Donation.findOne({ enquiryId, isDeleted: false });
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    // Default filter to exclude deleted donations
    const query = { ...filters, isDeleted: false };

    const donations = await Donation.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments(query);

    return {
      donations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(id, updateData) {
    return await Donation.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );
  }

  async softDeleteById(id) {
    return await Donation.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true },
    );
  }

  async deleteById(id) {
    return await Donation.findByIdAndDelete(id);
  }

  async exists(filter) {
    return await Donation.exists(filter);
  }

  async count(filter = {}) {
    return await Donation.countDocuments({ ...filter, isDeleted: false });
  }

  async findByContact(contact) {
    return await Donation.findOne({
      contact,
      isDeleted: false,
    });
  }
}

export default new DonationRepository();
