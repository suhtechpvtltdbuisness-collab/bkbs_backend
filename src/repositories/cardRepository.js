import Card from "../models/Card.js";

const LIST_CARD_SELECT =
  "-documents -__v";
const LIST_POPULATE = [
  { path: "createdBy", select: "name role employeeId email" },
  { path: "campId", select: "name lat long city state date" },
  { path: "distributedBy", select: "name" },
];

class CardRepository {
  async create(cardData) {
    const card = new Card(cardData);
    return await card.save();
  }

  async findById(id) {
    return await Card.findById(id)
      .populate("createdBy")
      .populate("campId", "name lat long city state date")
      .lean();
  }

  async findByApplicationId(applicationId) {
    return await Card.findOne({ applicationId })
      .populate("createdBy")
      .populate("campId", "name lat long city state date")
      .lean();
  }

  async findByCardNo(cardNo) {
    return await Card.findOne({ applicationId: cardNo })
      .populate("campId", "name lat long city state date")
      .lean();
  }

  buildListQuery(filters = {}) {
    return { ...filters, isDeleted: false };
  }

  buildListQueryChain(query, options = {}) {
    const {
      sort = { createdAt: -1 },
      select = LIST_CARD_SELECT,
      allowDiskUse = false,
    } = options;

    let cardQuery = Card.find(query)
      .select(select)
      .populate(LIST_POPULATE)
      .sort(sort)
      .lean();

    if (allowDiskUse) {
      cardQuery = cardQuery.allowDiskUse(true);
    }

    return cardQuery;
  }

  async findAll(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      select = LIST_CARD_SELECT,
      allowDiskUse = false,
      countLimit,
    } = options;

    const skip = (page - 1) * limit;
    const query = this.buildListQuery(filters);
    
    const countOptions = countLimit ? { limit: countLimit } : {};

    const [cards, total] = await Promise.all([
      this.buildListQueryChain(query, { sort, select, allowDiskUse })
        .skip(skip)
        .limit(limit),
      Card.countDocuments(query, countOptions),
    ]);

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
    )
      .populate("createdBy")
      .populate("campId", "name lat long city state date");
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

  /**
   * Count cards created on a day by payment method (via linked Payment record).
   */
  async countDailyByPaymentMethod(createdBy, start, end) {
    const ONLINE_METHODS = ["online", "upi", "card", "netbanking", "wallet"];

    const [result] = await Card.aggregate([
      {
        $match: {
          createdBy: String(createdBy),
          isDeleted: false,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "cardId",
          as: "payment",
        },
      },
      {
        $addFields: {
          paymentMethod: {
            $toLower: {
              $ifNull: [{ $arrayElemAt: ["$payment.paymentMethod", 0] }, ""],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          onlineCards: {
            $sum: {
              $cond: [{ $in: ["$paymentMethod", ONLINE_METHODS] }, 1, 0],
            },
          },
        },
      },
    ]);

    const total = result?.total ?? 0;
    const onlineCards = result?.onlineCards ?? 0;

    return {
      total,
      onlineCards,
      offlineCards: total - onlineCards,
    };
  }

  async findByCreatedBy(createdBy, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;
    const query = { createdBy, isDeleted: false };

    const [cards, total] = await Promise.all([
      this.buildListQueryChain(query, { sort }).skip(skip).limit(limit),
      Card.countDocuments(query),
    ]);

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

  async findByName(firstName, middleName, lastName) {
    return await Card.findOne({
      firstName,
      middleName: middleName || "",
      lastName: lastName || "",
      isDeleted: false,
    }).lean();
  }

  async findByContact(contact) {
    return await Card.findOne({
      contact,
      isDeleted: false,
    }).lean();
  }

  async findByEmail(email) {
    return await Card.findOne({
      email,
      isDeleted: false,
    }).lean();
  }

  async findByAadhaarNumber(aadhaarNumber) {
    return await Card.findOne({
      aadhaarNumber,
      isDeleted: false,
    }).lean();
  }
}

export default new CardRepository();
