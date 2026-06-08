import mongoose from "mongoose";
import duplicateReceiptRepository from "../repositories/duplicateReceiptRepository.js";
import Card from "../models/Card.js";
import User from "../models/User.js";
import { ApiError } from "../utils/apiResponse.js";
import { generateDuplicateReceiptNo } from "../utils/idGenerator.js";

class DuplicateReceiptService {
  async resolveCard(cardId) {
    let card = null;

    if (mongoose.Types.ObjectId.isValid(cardId)) {
      card = await Card.findOne({ _id: cardId, isDeleted: false });
    }

    if (!card) {
      card = await Card.findOne({ applicationId: cardId, isDeleted: false });
    }

    return card;
  }

  async createDuplicateReceipt(data, paymentProofImage, issuedBy) {
    const {
      cardId,
      penaltyAmount = 50,
      paymentMethod,
      paymentRef = "",
      paymentStatus = "pending",
    } = data;

    if (paymentMethod === "online" && !paymentRef) {
      throw new ApiError(400, "paymentRef is required for online payments");
    }

    if (paymentMethod === "offline" && !paymentProofImage) {
      throw new ApiError(
        400,
        "paymentProofImage is required for offline payments",
      );
    }

    const card = await this.resolveCard(cardId);
    if (!card) {
      throw new ApiError(404, "Card not found");
    }

    const clientName = [card.firstName, card.middleName, card.lastName]
      .filter(Boolean)
      .join(" ");

    let employeeId = "";
    let employeeName = "";
    if (card.createdBy && mongoose.Types.ObjectId.isValid(card.createdBy)) {
      const creator = await User.findById(card.createdBy)
        .select("name employeeId")
        .lean();
      if (creator) {
        employeeId = creator.employeeId || "";
        employeeName = creator.name || "";
      }
    }

    const receiptNo = await generateDuplicateReceiptNo();

    const created = await duplicateReceiptRepository.create({
      receiptNo,
      card: card._id,
      cardId: card.applicationId,
      originalReceiptNo: card.applicationId,
      clientName,
      mobile: card.contact,
      employeeId,
      employeeName,
      penaltyAmount,
      paymentMethod,
      paymentRef,
      paymentStatus,
      paymentProofImage,
      issuedDate: new Date(),
      issuedBy,
    });

    await Card.findByIdAndUpdate(card._id, {
      $inc: { duplicateReceiptCount: 1 },
      $set: { hasDuplicateReceipt: true },
    });

    return created;
  }

  buildSearchFilter(search) {
    const term = (search || "").trim();
    if (!term) {
      return {};
    }

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: escaped, $options: "i" };

    return {
      $or: [
        { receiptNo: regex },
        { cardId: regex },
        { clientName: regex },
        { mobile: regex },
        { employeeName: regex },
      ],
    };
  }

  async getDuplicateReceipts(options = {}) {
    const {
      page = 1,
      limit = 10,
      paymentStatus,
      paymentMethod,
      search,
    } = options;

    const filters = {};
    if (paymentStatus) {
      filters.paymentStatus = paymentStatus;
    }
    if (paymentMethod) {
      filters.paymentMethod = paymentMethod;
    }

    const searchFilter = this.buildSearchFilter(search);

    return await duplicateReceiptRepository.findAll(
      { ...filters, ...searchFilter },
      { page, limit },
    );
  }

  async deleteDuplicateReceipt(receiptNo) {
    const deleted = await duplicateReceiptRepository.deleteByReceiptNo(
      receiptNo,
    );

    if (!deleted) {
      throw new ApiError(404, "Duplicate receipt not found");
    }

    if (deleted.card) {
      const card = await Card.findById(deleted.card);
      if (card) {
        const nextCount = Math.max((card.duplicateReceiptCount || 0) - 1, 0);
        await Card.findByIdAndUpdate(deleted.card, {
          $set: {
            duplicateReceiptCount: nextCount,
            hasDuplicateReceipt: nextCount > 0,
          },
        });
      }
    }

    return { message: "Duplicate receipt deleted successfully" };
  }
}

export default new DuplicateReceiptService();
