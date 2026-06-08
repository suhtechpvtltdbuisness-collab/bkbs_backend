import DuplicateReceipt from "../models/DuplicateReceipt.js";

const POPULATE = [{ path: "issuedBy", select: "name" }];

class DuplicateReceiptRepository {
  async create(data) {
    const receipt = await DuplicateReceipt.create(data);
    return await DuplicateReceipt.findById(receipt._id)
      .populate(POPULATE)
      .lean();
  }

  async findByReceiptNo(receiptNo) {
    return await DuplicateReceipt.findOne({ receiptNo })
      .populate(POPULATE)
      .lean();
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { issuedDate: -1 } } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      DuplicateReceipt.find(filters)
        .populate(POPULATE)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      DuplicateReceipt.countDocuments(filters),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteByReceiptNo(receiptNo) {
    return await DuplicateReceipt.findOneAndDelete({ receiptNo });
  }
}

export default new DuplicateReceiptRepository();
