import mongoose from "mongoose";
import Card from "../models/Card.js";

const buildCreatedByMatch = (createdBy) => {
  const keys = [String(createdBy)];
  if (mongoose.Types.ObjectId.isValid(createdBy)) {
    keys.push(new mongoose.Types.ObjectId(createdBy));
  }
  return { $in: keys };
};

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
   * Daily settlement details: per-card amounts and summary by payment method.
   */
  async getDailySettlementDetails(createdBy, start, end, isoDate) {
    const ONLINE_METHODS = ["online", "upi", "card", "netbanking", "wallet"];

    const dateMatch = isoDate
      ? {
          $or: [
            { createdAt: { $gte: start, $lte: end } },
            { applicationDate: isoDate },
          ],
        }
      : { createdAt: { $gte: start, $lte: end } };

    const rows = await Card.aggregate([
      {
        $match: {
          createdBy: buildCreatedByMatch(createdBy),
          isDeleted: false,
          ...dateMatch,
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
          collectedAmount: {
            $ifNull: [
              { $arrayElemAt: ["$payment.amount", 0] },
              { $ifNull: ["$totalAmount", 0] },
            ],
          },
          transactionId: {
            $ifNull: [{ $arrayElemAt: ["$payment.transactionId", 0] }, ""],
          },
          orderId: {
            $ifNull: [{ $arrayElemAt: ["$payment.orderId", 0] }, ""],
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const cards = rows.map((row) => {
      const paymentMethod = row.paymentMethod || "cash";
      const isOnline = ONLINE_METHODS.includes(paymentMethod);
      const amount = Number(row.collectedAmount) || 0;

      return {
        cardId: row._id,
        applicationId: row.applicationId,
        applicantName: [row.firstName, row.middleName, row.lastName]
          .filter(Boolean)
          .join(" "),
        amount,
        paymentMethod,
        collectionType: isOnline ? "online" : "offline",
        transactionId: row.transactionId || "",
        orderId: row.orderId || "",
        createdAt: row.createdAt,
      };
    });

    const onlineCards = cards.filter((c) => c.collectionType === "online");
    const offlineCards = cards.filter((c) => c.collectionType === "offline");

    return {
      total: cards.length,
      onlineCards: onlineCards.length,
      offlineCards: offlineCards.length,
      onlineAmount: onlineCards.reduce((sum, c) => sum + c.amount, 0),
      offlineAmount: offlineCards.reduce((sum, c) => sum + c.amount, 0),
      cards,
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
