import cardRepository from "../repositories/cardRepository.js";
import cardMemberRepository from "../repositories/cardMemberRepository.js";
import { ApiError } from "../utils/apiResponse.js";
import {
  generateApplicationId,
  generateCardNumber,
} from "../utils/idGenerator.js";

class CardService {
  /**
   * Create new card
   */
  async createCard(cardData) {
    // Generate applicationId if not provided
    if (!cardData.applicationId) {
      cardData.applicationId = await generateApplicationId();
    }

    // Check if application ID already exists
    const existingCard = await cardRepository.findByApplicationId(
      cardData.applicationId,
    );

    if (existingCard) {
      throw new ApiError(409, "Application ID already exists");
    }

    const card = await cardRepository.create(cardData);
    return card;
  }

  /**
   * Get card by ID
   */
  async getCardById(id) {
    const card = await cardRepository.findById(id);

    if (!card || card.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    return card;
  }

  /**
   * Get card by application ID
   */
  async getCardByApplicationId(applicationId) {
    const card = await cardRepository.findByApplicationId(applicationId);

    if (!card || card.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    return card;
  }

  /**
   * Get card by card number
   */
  async getCardByCardNo(cardNo) {
    const card = await cardRepository.findByCardNo(cardNo);

    if (!card || card.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    return card;
  }

  /**
   * Get all cards
   */
  async getAllCards(filters, options) {
    return await cardRepository.findAll(filters, options);
  }

  /**
   * Get cards by creator
   */
  async getCardsByCreator(createdBy, options) {
    return await cardRepository.findByCreatedBy(createdBy, options);
  }

  /**
   * Update card
   */
  async updateCard(id, updateData) {
    // Prevent updating certain fields
    delete updateData.applicationId;
    delete updateData.createdBy;

    const card = await cardRepository.updateById(id, updateData);

    if (!card || card.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    return card;
  }

  /**
   * Update card status
   */
  async updateCardStatus(id, status) {
    const card = await cardRepository.updateById(id, { status });

    if (!card || card.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    return card;
  }

  /**
   * Issue card - Generate card number and activate
   */
  async issueCard(id, issueData = {}) {
    const card = await cardRepository.findById(id);

    if (!card || card.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    // Generate card number if not provided
    let cardNo = issueData.cardNo;
    if (!cardNo) {
      cardNo = await generateCardNumber();
    }

    // Update card with card number and issue date
    const updateData = {
      cardNo,
      cardIssueDate: issueData.cardIssueDate || new Date().toISOString(),
      cardExpiredDate: issueData.cardExpiredDate,
      status: "active",
    };

    const updatedCard = await cardRepository.updateById(id, updateData);

    return updatedCard;
  }

  /**
   * Soft delete card
   */
  async deleteCard(id) {
    const card = await cardRepository.softDeleteById(id);

    if (!card) {
      throw new ApiError(404, "Card not found");
    }

    // Also soft delete all card members
    const members = await cardMemberRepository.findByCardId(id);
    for (const member of members) {
      await cardMemberRepository.softDeleteById(member._id);
    }

    return { message: "Card deleted successfully" };
  }

  /**
   * Get card with members
   */
  async getCardWithMembers(id) {
    const card = await this.getCardById(id);
    const members = await cardMemberRepository.findByCardId(id);

    return {
      ...card.toObject(),
      members,
    };
  }

  /**
   * Get card statistics
   */
  async getCardStats() {
    const totalCards = await cardRepository.count();
    const pendingCards = await cardRepository.count({ status: "pending" });
    const approvedCards = await cardRepository.count({ status: "approved" });
    const activeCards = await cardRepository.count({ status: "active" });
    const expiredCards = await cardRepository.count({ status: "expired" });

    return {
      total: totalCards,
      pending: pendingCards,
      approved: approvedCards,
      active: activeCards,
      expired: expiredCards,
    };
  }
}

export default new CardService();
