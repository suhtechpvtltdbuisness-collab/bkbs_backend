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
import Payment from "../models/Payment.js";

class CardService {
  /**
   * Create new card with optional members and payment
   * Only employee, editor, or admin roles can create cards
   */
  async createCard(cardData, userRole) {
    // Check if user has permission to create card
    const allowedRoles = ["employee", "editor", "admin", "public"];
    if (!allowedRoles.includes(userRole)) {
      throw new ApiError(
        403,
        "Access denied. Only employees, editors, or admins can create cards.",
      );
    }

    // Extract members array and payment data from cardData
    const { members, payment, ...cardInfo } = cardData;

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

    // Set default dates if not provided
    const today = new Date().toISOString().split("T")[0];
    if (!cardInfo.cardIssueDate) {
      cardInfo.cardIssueDate = today;
    }
    if (!cardInfo.cardExpiredDate) {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      cardInfo.cardExpiredDate = oneYearFromNow.toISOString().split("T")[0];
    }

    // If members or payment data is provided, use transaction to create atomically
    if ((members && Array.isArray(members) && members.length > 0) || payment) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Set totalMember count if members provided
        if (members && Array.isArray(members) && members.length > 0) {
          cardInfo.totalMember = members.length;
        }

        // Create card
        const [card] = await Card.create([cardInfo], { session });

        // Create members with cardId reference if provided
        if (members && Array.isArray(members) && members.length > 0) {
          const membersWithCardId = members.map((member) => ({
            ...member,
            cardId: card._id,
          }));

          await CardMember.insertMany(membersWithCardId, { session });
        }

        // Create payment if payment data is provided
        let paymentRecord = null;
        if (payment) {
          const rawPaymentMethod = payment.paymentMethod ?? payment.method;
          const normalizedPaymentMethod =
            String(rawPaymentMethod || "cash").toLowerCase() === "offline"
              ? "cash"
              : String(rawPaymentMethod || "cash").toLowerCase();

          const paymentData = {
            cardId: card._id,
            createdBy: cardInfo.createdBy,
            orderId: payment.orderId,
            transactionId: payment.transactionId,
            amount: payment.amount ?? payment.totalAmount,
            paymentMethod: normalizedPaymentMethod,
            status: payment.status || "SUCCESS",
          };

          // Check if transaction ID already exists
          if (paymentData.transactionId) {
            const existingPayment = await Payment.findOne({
              transactionId: paymentData.transactionId,
            }).session(session);

            if (existingPayment) {
              if (paymentData.paymentMethod === "online") {
                const alreadyLinkedToAnotherCard =
                  existingPayment.cardId &&
                  existingPayment.cardId.toString() !== card._id.toString();

                if (alreadyLinkedToAnotherCard) {
                  throw new ApiError(
                    409,
                    `Payment with transaction ID ${paymentData.transactionId} is already linked to another card`,
                  );
                }

                existingPayment.cardId = card._id;
                if (paymentData.createdBy !== undefined) {
                  existingPayment.createdBy = paymentData.createdBy;
                }
                if (paymentData.amount !== undefined) {
                  existingPayment.amount = paymentData.amount;
                }
                if (paymentData.status) {
                  existingPayment.status = paymentData.status;
                }
                existingPayment.paymentMethod = paymentData.paymentMethod;
                paymentRecord = await existingPayment.save({ session });
              } else {
                throw new ApiError(
                  409,
                  `Payment with transaction ID ${paymentData.transactionId} already exists`,
                );
              }
            }
          }

          if (!paymentRecord) {
            [paymentRecord] = await Payment.create([paymentData], { session });
          }
        }

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        // Return card with populated members and payment
        const cardWithData = await Card.findById(card._id);
        const cardMembers = await CardMember.find({ cardId: card._id });
        const cardPayment = paymentRecord
          ? await Payment.findById(paymentRecord._id)
          : null;

        return {
          ...cardWithData.toObject(),
          members: cardMembers,
          payment: cardPayment,
        };
      } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    }

    // If no members and no payment, just create card
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

    // Get card members without cardId population for cleaner response
    const members = await cardMemberRepository.findByCardIdSimple(card._id);

    return {
      ...card.toObject(),
      members,
    };
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
    // Check if user is trying to update restricted fields
    if (updateData.applicationId) {
      throw new ApiError(400, "Application ID cannot be updated");
    }

    if (updateData.createdBy) {
      throw new ApiError(400, "Created by cannot be updated");
    }

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

  /**
   * Get all verified (not printed) cards
   */
  async getAllVerifiedCards(options = {}) {
    const { page = 1, limit = 10 } = options;

    // Query for cards where isPrint is false
    const filters = {
      isPrint: false,
      status: { $in: ["approved", "active"] }, // Only approved or active cards
    };

    return await cardRepository.findAll(filters, { page, limit });
  }

  /**
   * Update isPrint status for multiple cards
   */
  async updateIsPrintStatus(cardIds) {
    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      throw new ApiError(400, "cardIds must be a non-empty array");
    }

    // Validate all cardIds exist
    const cards = await Card.find({
      _id: { $in: cardIds },
      isDeleted: false,
    });

    if (cards.length !== cardIds.length) {
      throw new ApiError(404, "One or more cards not found");
    }

    // Update all cards to isPrint: true
    const result = await Card.updateMany(
      { _id: { $in: cardIds }, isDeleted: false },
      { $set: { isPrint: true } },
    );

    return {
      success: true,
      updated: result.modifiedCount,
      message: `${result.modifiedCount} card(s) marked as printed`,
    };
  }
}

export default new CardService();
