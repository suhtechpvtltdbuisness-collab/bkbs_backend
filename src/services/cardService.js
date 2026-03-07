import mongoose from "mongoose";
import cardRepository from "../repositories/cardRepository.js";
import cardMemberRepository from "../repositories/cardMemberRepository.js";
import { ApiError } from "../utils/apiResponse.js";
import {
  generateApplicationId,
  generateCardNumber,
} from "../utils/idGenerator.js";
import Card from "../models/Card.js";
import CardMember from "../models/CardMember.js";

class CardService {
  /**
   * Create new card with optional members
   * Only employee, editor, or admin roles can create cards
   */
  async createCard(cardData, userRole) {
    // Check if user has permission to create card
    const allowedRoles = ["employee", "editor", "admin"];
    if (!allowedRoles.includes(userRole)) {
      throw new ApiError(
        403,
        "Access denied. Only employees, editors, or admins can create cards.",
      );
    }

    // Extract members array from cardData
    const { members, ...cardInfo } = cardData;

    // Check if card already exists with same name (firstName + middleName + lastName)
    const existingCardByName = await cardRepository.findByName(
      cardInfo.firstName,
      cardInfo.middleName || "",
      cardInfo.lastName || "",
    );

    if (existingCardByName) {
      throw new ApiError(
        409,
        `Card already exists for ${cardInfo.firstName} ${cardInfo.middleName || ""} ${cardInfo.lastName || ""}`.trim(),
      );
    }

    // Check if phone number is already registered
    const existingCardByContact = await cardRepository.findByContact(
      cardInfo.contact,
    );

    if (existingCardByContact) {
      throw new ApiError(
        409,
        `Phone number ${cardInfo.contact} is already registered`,
      );
    }

    // Always auto-generate applicationId to ensure uniqueness
    cardInfo.applicationId = await generateApplicationId();

    // If members array is provided, use transaction to create card and members atomically
    if (members && Array.isArray(members) && members.length > 0) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Set totalMember count
        cardInfo.totalMember = members.length;

        // Create card
        const [card] = await Card.create([cardInfo], { session });

        // Create members with cardId reference
        const membersWithCardId = members.map((member) => ({
          ...member,
          cardId: card._id,
        }));

        await CardMember.insertMany(membersWithCardId, { session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        // Return card with populated members
        const cardWithMembers = await Card.findById(card._id);
        const cardMembers = await CardMember.find({ cardId: card._id });

        return {
          ...cardWithMembers.toObject(),
          members: cardMembers,
        };
      } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    }

    // If no members, just create card
    const card = await cardRepository.create(cardInfo);
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
