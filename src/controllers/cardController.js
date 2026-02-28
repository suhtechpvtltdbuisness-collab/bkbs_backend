import cardService from "../services/cardService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { paginate } from "../utils/helpers.js";

class CardController {
  /**
   * Create new card
   */
  async createCard(req, res, next) {
    try {
      const cardData = {
        ...req.body,
        createdBy: req.user.userId,
      };

      const card = await cardService.createCard(cardData);

      res
        .status(201)
        .json(
          new ApiResponse(201, card, "Card application created successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get card by ID
   */
  async getCardById(req, res, next) {
    try {
      const card = await cardService.getCardById(req.params.id);

      res
        .status(200)
        .json(new ApiResponse(200, card, "Card retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get card with members
   */
  async getCardWithMembers(req, res, next) {
    try {
      const card = await cardService.getCardWithMembers(req.params.id);

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            card,
            "Card with members retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all cards
   */
  async getAllCards(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const filters = {};

      // Apply filters
      if (req.query.status) {
        filters.status = req.query.status;
      }

      const result = await cardService.getAllCards(filters, { page, limit });

      res
        .status(200)
        .json(new ApiResponse(200, result, "Cards retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get my cards (cards created by logged-in user)
   */
  async getMyCards(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const result = await cardService.getCardsByCreator(req.user.userId, {
        page,
        limit,
      });

      res
        .status(200)
        .json(new ApiResponse(200, result, "Cards retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update card
   */
  async updateCard(req, res, next) {
    try {
      const card = await cardService.updateCard(req.params.id, req.body);

      res
        .status(200)
        .json(new ApiResponse(200, card, "Card updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update card status
   */
  async updateCardStatus(req, res, next) {
    try {
      const { status } = req.body;
      const card = await cardService.updateCardStatus(req.params.id, status);

      res
        .status(200)
        .json(new ApiResponse(200, card, "Card status updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Issue card (generate card number)
   */
  async issueCard(req, res, next) {
    try {
      const card = await cardService.issueCard(req.params.id, req.body);

      res
        .status(200)
        .json(new ApiResponse(200, card, "Card issued successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete card
   */
  async deleteCard(req, res, next) {
    try {
      const result = await cardService.deleteCard(req.params.id);

      res
        .status(200)
        .json(new ApiResponse(200, result, "Card deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get card statistics
   */
  async getCardStats(req, res, next) {
    try {
      const stats = await cardService.getCardStats();

      res
        .status(200)
        .json(
          new ApiResponse(200, stats, "Card statistics retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }
}

export default new CardController();
