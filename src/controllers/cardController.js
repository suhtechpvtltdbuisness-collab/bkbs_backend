import cardService from "../services/cardService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { paginate } from "../utils/helpers.js";
import { uploadToVercelBlob } from "../utils/vercelBlob.js";

class CardController {
  /**
   * Create new card
   * Only employee, editor, or admin can create cards
   */
  async createCard(req, res, next) {
    try {
      const cardData = {
        ...req.body,
        createdBy: req.user.userId,
      };

      // Handle uploaded documents
      if (req.files && req.files.documents && req.files.documents.length > 0) {
        const useVercelBlob =
          process.env.BLOB_READ_WRITE_TOKEN &&
          (process.env.VERCEL || process.env.NODE_ENV === "production");

        if (useVercelBlob) {
          // Upload to Vercel Blob (production/serverless)
          try {
            cardData.documents = await uploadToVercelBlob(req.files.documents);
          } catch (error) {
            console.error("Vercel Blob upload error:", error);
            throw new Error("Failed to upload documents to cloud storage");
          }
        } else {
          // Local file storage (development)
          cardData.documents = req.files.documents.map((file) => {
            // Extract relative path for URL access
            let relativePath = file.path;

            if (relativePath.startsWith("/tmp/uploads/")) {
              relativePath = relativePath.replace("/tmp/uploads/", "/uploads/");
            } else if (relativePath.includes("/uploads/")) {
              relativePath = relativePath.substring(
                relativePath.indexOf("/uploads/"),
              );
            }

            return {
              filename: file.filename,
              originalName: file.originalname,
              path: relativePath,
              size: file.size,
              mimetype: file.mimetype,
              uploadedAt: new Date(),
            };
          });
        }
      }

      // Parse members if it's a string (from multipart/form-data)
      if (typeof cardData.members === "string") {
        try {
          cardData.members = JSON.parse(cardData.members);
        } catch (error) {
          // If parsing fails, ignore members
          delete cardData.members;
        }
      }

      // Parse payment if it's a string (from multipart/form-data)
      if (typeof cardData.payment === "string") {
        try {
          cardData.payment = JSON.parse(cardData.payment);
        } catch (error) {
          // If parsing fails, ignore payment
          delete cardData.payment;
        }
      }

      const card = await cardService.createCard(cardData, req.user.role);

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
   * Admin: sees all cards
   * Employee/Editor: sees only cards created by them
   */
  async getAllCards(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const filters = {};

      // Apply filters
      if (req.query.status) {
        filters.status = req.query.status;
      }

      // Role-based filtering
      // If user is not admin, only show cards they created
      if (req.user.role !== "admin") {
        filters.createdBy = req.user.userId;
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

  /**
   * Get card by card number (Unauthorized - public access)
   */
  async getCardByCardNo(req, res, next) {
    try {
      const card = await cardService.getCardByCardNo(req.params.cardNo);

      res
        .status(200)
        .json(new ApiResponse(200, card, "Card retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all verified (not printed) cards
   */
  async getAllVerifiedCards(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const result = await cardService.getAllVerifiedCards({ page, limit });

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Verified cards retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all printed cards
   */
  async getAllPrintedCards(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const result = await cardService.getAllPrintedCards({ page, limit });

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Printed cards retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update isPrint status for multiple cards
   */
  async updateIsPrintStatus(req, res, next) {
    try {
      const { cardIds } = req.body;
      const result = await cardService.updateIsPrintStatus(cardIds);

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Card print status updated successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new card (Public - No authentication required)
   * Sets createdBy to -1 for public submissions
   */
  async createCardPublic(req, res, next) {
    try {
      const cardData = {
        ...req.body,
        createdBy: "-1",
      };

      // Handle uploaded documents
      if (req.files && req.files.documents && req.files.documents.length > 0) {
        const useVercelBlob =
          process.env.BLOB_READ_WRITE_TOKEN &&
          (process.env.VERCEL || process.env.NODE_ENV === "production");

        if (useVercelBlob) {
          // Upload to Vercel Blob (production/serverless)
          try {
            cardData.documents = await uploadToVercelBlob(req.files.documents);
          } catch (error) {
            console.error("Vercel Blob upload error:", error);
            throw new Error("Failed to upload documents to cloud storage");
          }
        } else {
          // Local file storage (development)
          cardData.documents = req.files.documents.map((file) => {
            // Extract relative path for URL access
            let relativePath = file.path;

            if (relativePath.startsWith("/tmp/uploads/")) {
              relativePath = relativePath.replace("/tmp/uploads/", "/uploads/");
            } else if (relativePath.includes("/uploads/")) {
              relativePath = relativePath.substring(
                relativePath.indexOf("/uploads/"),
              );
            }

            return {
              filename: file.filename,
              originalName: file.originalname,
              path: relativePath,
              size: file.size,
              mimetype: file.mimetype,
              uploadedAt: new Date(),
            };
          });
        }
      }

      // Parse members if it's a string (from multipart/form-data)
      if (typeof cardData.members === "string") {
        try {
          cardData.members = JSON.parse(cardData.members);
        } catch (error) {
          // If parsing fails, ignore members
          delete cardData.members;
        }
      }

      // Parse payment if it's a string (from multipart/form-data)
      if (typeof cardData.payment === "string") {
        try {
          cardData.payment = JSON.parse(cardData.payment);
        } catch (error) {
          // If parsing fails, ignore payment
          delete cardData.payment;
        }
      }

      const card = await cardService.createCard(cardData, "public");

      res
        .status(201)
        .json(
          new ApiResponse(201, card, "Card application created successfully"),
        );
    } catch (error) {
      next(error);
    }
  }
}

export default new CardController();
