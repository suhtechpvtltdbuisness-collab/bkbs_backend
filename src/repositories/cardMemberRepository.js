import CardMember from "../models/CardMember.js";

class CardMemberRepository {
  async create(memberData) {
    const member = new CardMember(memberData);
    return await member.save();
  }

  async createMany(membersData) {
    return await CardMember.insertMany(membersData);
  }

  async findById(id) {
    return await CardMember.findById(id).populate("cardId");
  }

  async findByCardId(cardId) {
    return await CardMember.find({ cardId, isDeleted: false }).populate(
      "cardId",
    );
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    const query = { ...filters, isDeleted: false };

    const members = await CardMember.find(query)
      .populate("cardId")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await CardMember.countDocuments(query);

    return {
      members,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(id, updateData) {
    return await CardMember.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("cardId");
  }

  async softDeleteById(id) {
    return await CardMember.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true },
    );
  }

  async deleteById(id) {
    return await CardMember.findByIdAndDelete(id);
  }

  async deleteByCardId(cardId) {
    return await CardMember.deleteMany({ cardId });
  }

  async exists(filter) {
    return await CardMember.exists(filter);
  }

  async count(filter = {}) {
    return await CardMember.countDocuments({ ...filter, isDeleted: false });
  }

  async countByCardId(cardId) {
    return await CardMember.countDocuments({ cardId, isDeleted: false });
  }
}

export default new CardMemberRepository();
