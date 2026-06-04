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
import User from "../models/User.js";

class CardService {
  /**
   * Extract profile pic from a card's documents array.
   * Priority: document with filename "family_head_photo.jpg",
   * then fallback to doc[2] if 4 docs, doc[3] if 5 docs.
   */
  extractProfilePic(documents = []) {
    if (!Array.isArray(documents) || documents.length === 0) {
      return null;
    }

    // 1. Look for family_head_photo by filename
    const familyHeadPhoto = documents.find(
      (doc) => doc.filename === "family_head_photo.jpg"
    );
    if (familyHeadPhoto) {
      return familyHeadPhoto.path || null;
    }

    // 2. Fallback based on documents length
    if (documents.length === 4 && documents[2]) {
      return documents[2].path || null;
    }
    if (documents.length === 5 && documents[3]) {
      return documents[3].path || null;
    }

    return null;
  }

  addTotalMembers(card, memberCount) {
    const cardObject = card?.toObject ? card.toObject() : card;

    if (!cardObject) {
      return cardObject;
    }

    const normalizedMemberCount =
      Number.isFinite(memberCount) && memberCount >= 0
        ? memberCount
        : Number(cardObject.totalMember) || 0;

    // Map database status to logical status for presentation
    let logicalStatus = cardObject.status;
    if (cardObject.isPrint) {
      logicalStatus = "exported";
    } else if (logicalStatus === "active") {
      logicalStatus = "approved";
    }

    return {
      ...cardObject,
      status: logicalStatus,
      totalMember: normalizedMemberCount,
      totalMembers: 1 + normalizedMemberCount,
    };
  }

  async getMemberCountsByCardIds(cardIds = []) {
    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return {};
    }

    const counts = await CardMember.aggregate([
      {
        $match: {
          cardId: { $in: cardIds },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$cardId",
          count: { $sum: 1 },
        },
      },
    ]);

    return counts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});
  }

  async addTotalMembersToCard(card) {
    if (!card?._id) {
      return this.addTotalMembers(card, 0);
    }

    const count = await cardMemberRepository.countByCardId(card._id);
    return this.addTotalMembers(card, count);
  }

  async addTotalMembersToResult(result) {
    if (!result || !Array.isArray(result.cards)) {
      return result;
    }

    const cardIds = result.cards.map((card) => card?._id).filter(Boolean);

    const countsByCardId = await this.getMemberCountsByCardIds(cardIds);

    return {
      ...result,
      cards: result.cards.map((card) => {
        const count = countsByCardId[card._id.toString()] || 0;
        return this.addTotalMembers(card, count);
      }),
    };
  }

  buildCardSearchFilter(searchTerm) {
    if (typeof searchTerm !== "string") {
      return {};
    }

    const term = searchTerm.trim();
    if (!term) {
      return {};
    }

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: escapedTerm, $options: "i" };
    const orConditions = [
      { applicationId: regex },
      { cardNo: regex },
      { firstName: regex },
      { middleName: regex },
      { lastName: regex },
      { contact: regex },
      { alternateContact: regex },
      { pincode: regex },
    ];

    if (mongoose.Types.ObjectId.isValid(term)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(term) });
    }

    if (/^\d+(\.\d+)?$/.test(term)) {
      orConditions.push({ totalAmount: Number(term) });
    }

    // Smart Multi-word / Full Name Search logic
    const words = term.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      const escapedWords = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      
      if (words.length === 2) {
        const firstRegex = { $regex: escapedWords[0], $options: "i" };
        const secondRegex = { $regex: escapedWords[1], $options: "i" };
        
        orConditions.push(
          // First Name + Last Name
          {
            $and: [
              { firstName: firstRegex },
              { lastName: secondRegex }
            ]
          },
          // First Name + Middle Name
          {
            $and: [
              { firstName: firstRegex },
              { middleName: secondRegex }
            ]
          },
          // Middle Name + Last Name
          {
            $and: [
              { middleName: firstRegex },
              { lastName: secondRegex }
            ]
          }
        );
      } else if (words.length >= 3) {
        const firstRegex = { $regex: escapedWords[0], $options: "i" };
        const middleRegex = { $regex: escapedWords[1], $options: "i" };
        const lastRegex = { $regex: escapedWords[2], $options: "i" };
        
        orConditions.push(
          // First Name + Middle Name + Last Name
          {
            $and: [
              { firstName: firstRegex },
              { middleName: middleRegex },
              { lastName: lastRegex }
            ]
          }
        );
      }
    }

    return { $or: orConditions };
  }

  async findCreatorIdsBySearch(searchTerm) {
    if (typeof searchTerm !== "string") {
      return [];
    }

    const term = searchTerm.trim();
    if (!term) {
      return [];
    }

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const words = term.split(/\s+/).filter(Boolean);

    const userQuery = { isDeleted: false };
    if (words.length > 1) {
      userQuery.$and = words.map((word) => ({
        name: {
          $regex: word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      }));
    } else {
      userQuery.name = { $regex: escapedTerm, $options: "i" };
    }

    const users = await User.find(userQuery).select("_id").lean();
    // Cards store createdBy as string userId, not ObjectId
    return users.map((user) => user._id.toString());
  }

  async applyCardSearchFilters(filters = {}) {
    const { search, createdAt, ...rest } = filters;
    const query = { ...rest };

    if (createdAt) {
      // Check if YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(createdAt)) {
        const start = new Date(createdAt);
        start.setUTCHours(0, 0, 0, 0);
        
        const end = new Date(createdAt);
        end.setUTCHours(23, 59, 59, 999);
        
        query.createdAt = { $gte: start, $lte: end };
      } else {
        const parsedDate = new Date(createdAt);
        if (!isNaN(parsedDate.getTime())) {
          const start = new Date(parsedDate);
          start.setUTCHours(0, 0, 0, 0);
          
          const end = new Date(parsedDate);
          end.setUTCHours(23, 59, 59, 999);
          
          query.createdAt = { $gte: start, $lte: end };
        }
      }
    }

    if (!search) {
      return query;
    }

    const searchFilter = this.buildCardSearchFilter(search);
    const creatorIds = await this.findCreatorIdsBySearch(search);

    if (creatorIds.length > 0 && searchFilter.$or) {
      searchFilter.$or.push({ createdBy: { $in: creatorIds } });
    }

    return {
      ...query,
      ...searchFilter,
    };
  }

  normalizeCardOptionalFields(cardData = {}) {
    const normalized = { ...cardData };

    if (Object.hasOwn(normalized, "status")) {
      if (normalized.status === "exported") {
        normalized.status = "approved";
        normalized.isPrint = true;
      }
    }

    if (Object.hasOwn(normalized, "alternateContact")) {
      normalized.alternateContact =
        typeof normalized.alternateContact === "string"
          ? normalized.alternateContact.trim()
          : normalized.alternateContact;
    }

    if (Object.hasOwn(normalized, "religion")) {
      normalized.religion =
        typeof normalized.religion === "string"
          ? normalized.religion.trim()
          : normalized.religion;
    }

    if (Object.hasOwn(normalized, "campId")) {
      if (typeof normalized.campId === "string") {
        const trimmedCampId = normalized.campId.trim();
        normalized.campId = trimmedCampId || undefined;
      }
    }

    return normalized;
  }

  normalizeMembersInput(members = []) {
    if (!Array.isArray(members)) {
      return [];
    }

    return members
      .filter((member) => member && typeof member === "object")
      .map((member) => ({
        name: member.name,
        relation: member.relation,
        age: Number(member.age),
        documentId: member.documentId ?? member.docId ?? "",
      }));
  }

  applyVerificationDateRules(existingCard, updateData = {}) {
    const normalized = { ...updateData };
    const verifiedStatuses = ["approved", "active"];

    if (Object.hasOwn(normalized, "status")) {
      if (verifiedStatuses.includes(normalized.status)) {
        if (!normalized.verificationDate) {
          normalized.verificationDate = new Date().toISOString().split("T")[0];
        }
      } else {
        normalized.verificationDate = "";
      }
      return normalized;
    }

    if (
      Object.hasOwn(normalized, "verificationDate") &&
      !verifiedStatuses.includes(existingCard?.status)
    ) {
      delete normalized.verificationDate;
    }

    return normalized;
  }

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
    const normalizedCardData = this.normalizeCardOptionalFields(cardData);
    const { members, payment, ...cardInfo } = normalizedCardData;
    const normalizedMembers = this.normalizeMembersInput(members);

    // Keep member count authoritative on server side.
    cardInfo.totalMember = normalizedMembers.length;

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

    // Check if Aadhaar number is already registered
    if (cardInfo.aadhaarNumber) {
      const existingCardByAadhaar = await cardRepository.findByAadhaarNumber(
        cardInfo.aadhaarNumber,
      );

      if (existingCardByAadhaar) {
        throw new ApiError(
          409,
          `Aadhaar number ${cardInfo.aadhaarNumber} is already registered`,
        );
      }
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
    if (normalizedMembers.length > 0 || payment) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Create card
        const [card] = await Card.create([cardInfo], { session });

        // Create members with cardId reference if provided
        if (normalizedMembers.length > 0) {
          const membersWithCardId = normalizedMembers.map((member) => ({
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
        const cardWithData = await Card.findById(card._id).populate(
          "campId",
          "name lat long city state date",
        );
        const cardMembers = await CardMember.find({ cardId: card._id });
        const cardPayment = paymentRecord
          ? await Payment.findById(paymentRecord._id)
          : null;

        return {
          ...this.addTotalMembers(cardWithData, cardMembers.length),
          members: cardMembers,
          payment: cardPayment,
        };
      } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        session.endSession();

        // Check if standalone MongoDB (replica set not configured)
        if (
          error.name === "MongoServerError" &&
          (error.message.includes("Transaction numbers are only allowed") ||
           error.message.includes("sessions are not supported"))
        ) {
          console.warn("MongoDB Standalone mode detected (no replica set). Falling back to non-transactional card creation.");

          // Create card without transaction
          const card = await Card.create(cardInfo);

          // Create members with cardId reference if provided
          if (normalizedMembers.length > 0) {
            const membersWithCardId = normalizedMembers.map((member) => ({
              ...member,
              cardId: card._id,
            }));

            await CardMember.insertMany(membersWithCardId);
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
              });

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
                  paymentRecord = await existingPayment.save();
                } else {
                  throw new ApiError(
                    409,
                    `Payment with transaction ID ${paymentData.transactionId} already exists`,
                  );
                }
              }
            }

            if (!paymentRecord) {
              paymentRecord = await Payment.create(paymentData);
            }
          }

          // Return card with populated members and payment
          const cardWithData = await Card.findById(card._id).populate(
            "campId",
            "name lat long city state date",
          );
          const cardMembers = await CardMember.find({ cardId: card._id });
          const cardPayment = paymentRecord
            ? await Payment.findById(paymentRecord._id)
            : null;

          return {
            ...this.addTotalMembers(cardWithData, cardMembers.length),
            members: cardMembers,
            payment: cardPayment,
          };
        }

        throw error;
      }
    }

    // If no members and no payment, just create card
    const card = await cardRepository.create(cardInfo);
    return this.addTotalMembers(card, 0);
  }

  /**
   * Get card by ID
   */
  async getCardById(id) {
    const card = await cardRepository.findById(id);

    if (!card || card.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    return await this.addTotalMembersToCard(card);
  }

  /**
   * Get card by application ID
   */
  async getCardByApplicationId(applicationId) {
    const card = await cardRepository.findByApplicationId(applicationId);

    if (!card || card.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    return await this.addTotalMembersToCard(card);
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

    const memberCount = members.length;
    const cardWithTotalMembers = this.addTotalMembers(card, memberCount);

    return {
      ...cardWithTotalMembers,
      members,
    };
  }

  /**
   * Get all cards
   */
  async getAllCards(filters, options) {
    const result = await cardRepository.findAll(
      await this.applyCardSearchFilters(filters),
      options,
    );
    return await this.addTotalMembersToResult(result);
  }

  async getCardsByCreator(createdBy, options = {}) {
    const { page = 1, limit = 10, search, createdAt, sort } = options;

    const filters = await this.applyCardSearchFilters({
      createdBy,
      search,
      createdAt,
    });

    const sortOption = sort || (createdAt ? { createdAt: 1 } : { createdAt: -1 });

    // Include documents (for profile image extraction), sort by options
    const result = await cardRepository.findAll(filters, {
      page,
      limit,
      sort: sortOption,
      allowDiskUse: false,
      select: "-__v",
    });

    const cardIds = result.cards.map((card) => card._id);
    if (cardIds.length === 0) {
      return await this.addTotalMembersToResult({
        ...result,
        cards: [],
      });
    }

    // Fetch only members (documents are already in result.cards!)
    const members = await CardMember.find({
      cardId: { $in: cardIds },
      isDeleted: false,
    })
      .select("cardId name relation documentId age")
      .lean();

    const membersByCardId = members.reduce((acc, member) => {
      const key = member.cardId.toString();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(member);
      return acc;
    }, {});

    // Build a map of cardId -> profilePic path directly from result.cards
    const profilePicByCardId = result.cards.reduce((acc, card) => {
      acc[card._id.toString()] = this.extractProfilePic(card.documents);
      return acc;
    }, {});

    const cardsWithMembers = result.cards.map((card) => {
      const cardIdStr = card._id.toString();
      const memberCount = (membersByCardId[cardIdStr] || []).length;
      const cardObject = this.addTotalMembers(card, memberCount);
      const { documents, ...cardWithoutDocs } = cardObject;
      return {
        ...cardWithoutDocs,
        profilePic: profilePicByCardId[cardIdStr] || null,
        members: membersByCardId[cardIdStr] || [],
      };
    });

    return { ...result, cards: cardsWithMembers };
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

    const existingCard = await cardRepository.findById(id);
    if (!existingCard || existingCard.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    const normalizedUpdateData = this.normalizeCardOptionalFields(updateData);
    const hasMembersUpdate = Object.hasOwn(normalizedUpdateData, "members");
    const normalizedMembers = hasMembersUpdate
      ? this.normalizeMembersInput(normalizedUpdateData.members)
      : [];

    delete normalizedUpdateData.members;

    const cardUpdateData = this.applyVerificationDateRules(
      existingCard,
      normalizedUpdateData,
    );

    let card;

    if (hasMembersUpdate) {
      card = await Card.findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          $set: {
            ...cardUpdateData,
            totalMember: normalizedMembers.length,
          },
        },
        { new: true, runValidators: true },
      );

      if (!card) {
        throw new ApiError(404, "Card not found");
      }

      await CardMember.updateMany(
        { cardId: id, isDeleted: false },
        { $set: { isDeleted: true } },
      );

      if (normalizedMembers.length > 0) {
        const membersWithCardId = normalizedMembers.map((member) => ({
          ...member,
          cardId: id,
        }));
        await CardMember.insertMany(membersWithCardId);
      }

      card = await cardRepository.findById(id);
    } else {
      card = await cardRepository.updateById(id, cardUpdateData);
    }

    if (!card || card.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    const members = await cardMemberRepository.findByCardIdSimple(id);
    const cardWithTotals = this.addTotalMembers(card, members.length);

    return {
      ...cardWithTotals,
      members,
    };
  }

  /**
   * Update card status
   */
  async updateCardStatus(id, status) {
    const updateData = { status };
    if (status === "exported") {
      updateData.status = "approved";
      updateData.isPrint = true;
      updateData.verificationDate = new Date().toISOString().split("T")[0];
    } else if (["approved", "active"].includes(status)) {
      updateData.verificationDate = new Date().toISOString().split("T")[0];
    } else {
      updateData.verificationDate = "";
      updateData.isPrint = false;
    }

    const card = await cardRepository.updateById(id, updateData);

    if (!card || card.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    return await this.addTotalMembersToCard(card);
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

    return await this.addTotalMembersToCard(updatedCard);
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
      ...card,
      members,
    };
  }

  /**
   * Get card statistics
   */
  async getCardStats() {
    const totalCards = await cardRepository.count();
    const pendingCards = await cardRepository.count({ status: "pending" });
    const approvedCards = await cardRepository.count({ status: "approved", isPrint: { $ne: true } });
    const activeCards = await cardRepository.count({ status: "active", isPrint: { $ne: true } });
    const expiredCards = await cardRepository.count({ status: "expired", isPrint: { $ne: true } });
    const rejectedCards = await cardRepository.count({ status: "rejected", isPrint: { $ne: true } });
    const exportedCards = await cardRepository.count({ isPrint: true });

    return {
      total: totalCards,
      pending: pendingCards,
      approved: approvedCards + activeCards,
      active: activeCards,
      rejected: rejectedCards,
      expired: expiredCards,
      exported: exportedCards,
    };
  }

  async getAllVerifiedCards(options = {}) {
    const { page = 1, limit = 10, search, createdAt, sort } = options;

    // Query for cards where isPrint is false or missing
    const filters = await this.applyCardSearchFilters({
      isPrint: { $ne: true },
      status: { $in: ["approved", "active"] }, // Only approved or active cards
      search,
      createdAt,
    });

    const sortOption = sort || (createdAt ? { createdAt: 1 } : { createdAt: -1 });

    const result = await cardRepository.findAll(filters, { page, limit, select: "-__v", sort: sortOption });

    const cardIds = result.cards.map((card) => card._id);
    if (cardIds.length === 0) {
      return await this.addTotalMembersToResult({
        ...result,
        cards: [],
      });
    }

    // Fetch only members (documents are already in result.cards!)
    const members = await CardMember.find({
      cardId: { $in: cardIds },
      isDeleted: false,
    })
      .select("cardId name relation documentId age")
      .lean();

    const membersByCardId = members.reduce((acc, member) => {
      const key = member.cardId.toString();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(member);
      return acc;
    }, {});

    // Build a map of cardId -> profilePic path directly from result.cards
    const profilePicByCardId = result.cards.reduce((acc, card) => {
      acc[card._id.toString()] = this.extractProfilePic(card.documents);
      return acc;
    }, {});

    const cardsWithMembers = result.cards.map((card) => {
      const cardIdStr = card._id.toString();
      const memberCount = (membersByCardId[cardIdStr] || []).length;
      const cardObject = this.addTotalMembers(card, memberCount);
      const { documents, ...cardWithoutDocs } = cardObject;
      return {
        ...cardWithoutDocs,
        profilePic: profilePicByCardId[cardIdStr] || null,
        members: membersByCardId[cardIdStr] || [],
      };
    });

    return {
      ...result,
      cards: cardsWithMembers,
    };
  }

  /**
   * Get all printed cards (no member join — uses stored totalMember)
   */
  async getAllPrintedCards(options = {}) {
    const { page = 1, limit = 10, search, createdAt, sort } = options;

    const filters = await this.applyCardSearchFilters({
      isPrint: true,
      search,
      createdAt,
    });

    const sortOption = sort || (createdAt ? { createdAt: 1 } : { _id: -1 });

    // Include documents (for profile image extraction), sort by _id (always indexed)
    const result = await cardRepository.findAll(filters, {
      page,
      limit,
      sort: sortOption,
      allowDiskUse: false,
      select: "-__v",
    });

    const cardIds = result.cards.map((card) => card._id);
    if (cardIds.length === 0) {
      return await this.addTotalMembersToResult({
        ...result,
        cards: [],
      });
    }

    // Fetch only members (documents are already in result.cards!)
    const members = await CardMember.find({
      cardId: { $in: cardIds },
      isDeleted: false,
    })
      .select("cardId name relation documentId age")
      .lean();

    const membersByCardId = members.reduce((acc, member) => {
      const key = member.cardId.toString();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(member);
      return acc;
    }, {});

    // Build a map of cardId -> profilePic path directly from result.cards
    const profilePicByCardId = result.cards.reduce((acc, card) => {
      acc[card._id.toString()] = this.extractProfilePic(card.documents);
      return acc;
    }, {});

    const cardsWithMembers = result.cards.map((card) => {
      const cardIdStr = card._id.toString();
      const memberCount = (membersByCardId[cardIdStr] || []).length;
      const cardObject = this.addTotalMembers(card, memberCount);
      const { documents, ...cardWithoutDocs } = cardObject;
      return {
        ...cardWithoutDocs,
        profilePic: profilePicByCardId[cardIdStr] || null,
        members: membersByCardId[cardIdStr] || [],
      };
    });

    return { ...result, cards: cardsWithMembers };
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

  /**
   * Check if contact already exists in cards
   */
  async checkPhoneExists(contact) {
    if (!contact || !contact.trim()) {
      throw new ApiError(400, "Contact is required");
    }

    const card = await cardRepository.findByContact(contact.trim());

    return {
      exists: !!card,
      field: "contact",
      value: contact.trim(),
      cardId: card?._id || null,
    };
  }

  /**
   * Check if name already exists in cards
   */
  async checkNameExists(firstName, middleName, lastName) {
    if (!firstName || !firstName.trim()) {
      throw new ApiError(400, "First name is required");
    }

    const card = await cardRepository.findByName(
      firstName.trim(),
      (middleName || "").trim(),
      (lastName || "").trim(),
    );

    return {
      exists: false,
      duplicateByName: !!card,
      field: "name",
      value: {
        firstName: firstName.trim(),
        middleName: (middleName || "").trim(),
        lastName: (lastName || "").trim(),
      },
      cardId: card?._id || null,
      note: "Name alone is no longer a uniqueness constraint. Use Aadhaar to validate duplicates.",
    };
  }

  /**
   * Check if email already exists in cards
   */
  async checkEmailExists(email) {
    if (!email || !email.trim()) {
      throw new ApiError(400, "Email is required");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const card = await cardRepository.findByEmail(normalizedEmail);

    return {
      exists: !!card,
      field: "email",
      value: normalizedEmail,
      cardId: card?._id || null,
    };
  }

  /**
   * Check if Aadhaar number already exists in cards
   */
  async checkAadhaarExists(aadhaarNumber) {
    if (!aadhaarNumber || !aadhaarNumber.trim()) {
      throw new ApiError(400, "Aadhaar number is required");
    }

    const normalizedAadhaar = aadhaarNumber.trim();

    if (!/^\d{12}$/.test(normalizedAadhaar)) {
      throw new ApiError(400, "Aadhaar number must be exactly 12 digits");
    }

    const card = await cardRepository.findByAadhaarNumber(normalizedAadhaar);

    return {
      exists: !!card,
      field: "aadhaarNumber",
      value: normalizedAadhaar,
      cardId: card?._id || null,
    };
  }
}

export default new CardService();
