import cardMemberService from "../services/cardMemberService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { paginate } from "../utils/helpers.js";

class CardMemberController {
  /**
   * Add card member
   */
  async addCardMember(req, res, next) {
    try {
      const memberData = {
        ...req.body,
        cardId: req.params.cardId,
      };

      const member = await cardMemberService.addCardMember(memberData);

      res
        .status(201)
        .json(new ApiResponse(201, member, "Card member added successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add multiple card members
   */
  async addCardMembers(req, res, next) {
    try {
      const { members } = req.body;
      const result = await cardMemberService.addCardMembers(
        req.params.cardId,
        members,
      );

      res
        .status(201)
        .json(new ApiResponse(201, result, "Card members added successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get card member by ID
   */
  async getCardMemberById(req, res, next) {
    try {
      const member = await cardMemberService.getCardMemberById(req.params.id);

      res
        .status(200)
        .json(
          new ApiResponse(200, member, "Card member retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all members of a card
   */
  async getMembersByCardId(req, res, next) {
    try {
      const members = await cardMemberService.getMembersByCardId(
        req.params.cardId,
      );

      res
        .status(200)
        .json(
          new ApiResponse(200, members, "Card members retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all card members
   */
  async getAllCardMembers(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const filters = {};

      if (req.query.cardId) {
        filters.cardId = req.query.cardId;
      }

      const result = await cardMemberService.getAllCardMembers(filters, {
        page,
        limit,
      });

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Card members retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update card member
   */
  async updateCardMember(req, res, next) {
    try {
      const member = await cardMemberService.updateCardMember(
        req.params.id,
        req.body,
      );

      res
        .status(200)
        .json(new ApiResponse(200, member, "Card member updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete card member
   */
  async deleteCardMember(req, res, next) {
    try {
      const result = await cardMemberService.deleteCardMember(req.params.id);

      res
        .status(200)
        .json(new ApiResponse(200, result, "Card member deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}

export default new CardMemberController();
