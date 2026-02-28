import Card from "../models/Card.js";

class CardRepository {
  async create(cardData) {
    const card = new Card(cardData);
    return await card.save();
  }

  async findById(id) {
    return await Card.findById(id).populate("createdBy");
  }

  async findByApplicationId(applicationId) {
    return await Card.findOne({ applicationId }).populate("createdBy");
  }

  async findByCardNo(cardNo) {
    return await Card.findOne({ cardNo }).populate("createdBy");
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    // Default filter to exclude deleted cards
    const query = { ...filters, isDeleted: false };

    const cards = await Card.find(query)
      .populate("createdBy")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Card.countDocuments(query);

    return {
      cards,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(id, updateData) {
    return await Card.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("createdBy");
  }

  async softDeleteById(id) {
    return await Card.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true },
    );
  }

  async deleteById(id) {
    return await Card.findByIdAndDelete(id);
  }

  async exists(filter) {
    return await Card.exists(filter);
  }

  async count(filter = {}) {
    return await Card.countDocuments({ ...filter, isDeleted: false });
  }

  async findByCreatedBy(createdBy, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    const cards = await Card.find({ createdBy, isDeleted: false })
      .populate("createdBy")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Card.countDocuments({ createdBy, isDeleted: false });

    return {
      cards,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export default new CardRepository();
