import cardMemberRepository from "../repositories/cardMemberRepository.js";
import cardRepository from "../repositories/cardRepository.js";
import { ApiError } from "../utils/apiResponse.js";

class CardMemberService {
  /**
   * Add card member
   */
  async addCardMember(memberData) {
    // Verify card exists
    const card = await cardRepository.findById(memberData.cardId);
    if (!card || card.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    const member = await cardMemberRepository.create(memberData);

    // Update total member count in card
    const memberCount = await cardMemberRepository.countByCardId(
      memberData.cardId,
    );
    await cardRepository.updateById(memberData.cardId, {
      totalMember: memberCount,
    });

    return member;
  }

  /**
   * Add multiple card members
   */
  async addCardMembers(cardId, membersData) {
    // Verify card exists
    const card = await cardRepository.findById(cardId);
    if (!card || card.isDeleted) {
      throw new ApiError(404, "Card not found");
    }

    // Add cardId to each member data
    const membersWithCardId = membersData.map((member) => ({
      ...member,
      cardId,
    }));

    const members = await cardMemberRepository.createMany(membersWithCardId);

    // Update total member count in card
    const memberCount = await cardMemberRepository.countByCardId(cardId);
    await cardRepository.updateById(cardId, { totalMember: memberCount });

    return members;
  }

  /**
   * Get card member by ID
   */
  async getCardMemberById(id) {
    const member = await cardMemberRepository.findById(id);

    if (!member || member.isDeleted) {
      throw new ApiError(404, "Card member not found");
    }

    return member;
  }

  /**
   * Get all members of a card
   */
  async getMembersByCardId(cardId) {
    const members = await cardMemberRepository.findByCardId(cardId);
    return members;
  }

  /**
   * Get all card members
   */
  async getAllCardMembers(filters, options) {
    return await cardMemberRepository.findAll(filters, options);
  }

  /**
   * Update card member
   */
  async updateCardMember(id, updateData) {
    // Prevent updating cardId
    delete updateData.cardId;

    const member = await cardMemberRepository.updateById(id, updateData);

    if (!member || member.isDeleted) {
      throw new ApiError(404, "Card member not found");
    }

    return member;
  }

  /**
   * Delete card member
   */
  async deleteCardMember(id) {
    const member = await cardMemberRepository.findById(id);

    if (!member || member.isDeleted) {
      throw new ApiError(404, "Card member not found");
    }

    await cardMemberRepository.softDeleteById(id);

    // Update total member count in card
    const memberCount = await cardMemberRepository.countByCardId(member.cardId);
    await cardRepository.updateById(member.cardId, {
      totalMember: memberCount,
    });

    return { message: "Card member deleted successfully" };
  }

  /**
   * Delete all members of a card
   */
  async deleteCardMembers(cardId) {
    await cardMemberRepository.deleteByCardId(cardId);

    // Update total member count in card
    await cardRepository.updateById(cardId, { totalMember: 0 });

    return { message: "All card members deleted successfully" };
  }
}

export default new CardMemberService();
