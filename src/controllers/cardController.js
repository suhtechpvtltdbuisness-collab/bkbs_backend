import cardService from "../services/cardService.js";
import { ApiError, ApiResponse } from "../utils/apiResponse.js";
import { paginate } from "../utils/helpers.js";
import { uploadToVercelBlob, storeUploadedImage } from "../utils/vercelBlob.js";

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

      // Parse documents metadata if it's a string (from multipart/form-data)
      if (typeof cardData.documents === "string") {
        try {
          cardData.documents = JSON.parse(cardData.documents);
        } catch (error) {
          // If parsing fails, ignore documents metadata
        }
      }
      const bodyDocuments = Array.isArray(cardData.documents) ? cardData.documents : [];

      // Handle uploaded documents
      if (req.files && req.files.documents && req.files.documents.length > 0) {
        const useVercelBlob =
          process.env.BLOB_READ_WRITE_TOKEN &&
          (process.env.VERCEL || process.env.NODE_ENV === "production");

        if (useVercelBlob) {
          // Upload to Vercel Blob (production/serverless)
          try {
            const uploaded = await uploadToVercelBlob(req.files.documents);
            cardData.documents = uploaded.map((file, idx) => ({
              name: bodyDocuments[idx]?.name || "",
              ...file,
            }));
          } catch (error) {
            console.error("Vercel Blob upload error:", error);
            throw new Error("Failed to upload documents to cloud storage");
          }
        } else {
          // Local file storage (development)
          cardData.documents = req.files.documents.map((file, idx) => {
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
              name: bodyDocuments[idx]?.name || "",
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
   * Get all cards (admin, editor, employee)
   */
  async getAllCards(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const filters = {};

      // Apply filters
      if (req.query.status) {
        const queryStatus = req.query.status.toLowerCase();
        if (queryStatus === "exported") {
          filters.isPrint = true;
        } else if (queryStatus === "approved") {
          filters.status = { $in: ["approved", "active"] };
          filters.isPrint = { $ne: true };
        } else if (["pending", "rejected", "expired"].includes(queryStatus)) {
          filters.status = queryStatus;
          filters.isPrint = { $ne: true };
        } else {
          filters.status = { $in: [] };
        }
      }

      if (req.query.search) {
        filters.search = req.query.search;
      }

      if (req.query.createdAt) {
        filters.createdAt = req.query.createdAt;
      }

      const sort = req.query.sort ? { [req.query.sort.replace("-", "")]: req.query.sort.startsWith("-") ? -1 : 1 } : undefined;

      const result = await cardService.getAllCards(filters, { page, limit, sort });

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
        search: req.query.search,
        createdAt: req.query.createdAt,
        sort: req.query.sort ? { [req.query.sort.replace("-", "")]: req.query.sort.startsWith("-") ? -1 : 1 } : undefined,
      });

      res
        .status(200)
        .json(new ApiResponse(200, result, "Cards retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cards created by a specific employee
   */
  async getCardsByEmployee(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const result = await cardService.getCardsByCreator(req.params.employeeId, {
        page,
        limit,
        search: req.query.search,
        createdAt: req.query.createdAt,
        sort: req.query.sort ? { [req.query.sort.replace("-", "")]: req.query.sort.startsWith("-") ? -1 : 1 } : undefined,
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
   * Distribute (settle) a card - upload recipient photo and mark distributed
   */
  async distributeCard(req, res, next) {
    try {
      const distributedImage = await storeUploadedImage(
        req.file,
        req.body?.image,
        "distributions",
      );

      if (!distributedImage) {
        throw new ApiError(400, "Image is required");
      }

      const card = await cardService.distributeCard(req.params.id, {
        distributedImage,
        distributedBy: req.user.userId,
      });

      res
        .status(200)
        .json(new ApiResponse(200, card, "Card distributed successfully"));
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
      const result = await cardService.getAllVerifiedCards({
        page,
        limit,
        search: req.query.search,
        createdAt: req.query.createdAt,
        sort: req.query.sort ? { [req.query.sort.replace("-", "")]: req.query.sort.startsWith("-") ? -1 : 1 } : undefined,
      });

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
      const result = await cardService.getAllPrintedCards({
        page,
        limit,
        search: req.query.search,
        createdAt: req.query.createdAt,
        distributed: req.query.distributed,
        sort: req.query.sort ? { [req.query.sort.replace("-", "")]: req.query.sort.startsWith("-") ? -1 : 1 } : undefined,
      });

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
   * Check if phone/contact already exists in cards
   */
  async checkPhoneExists(req, res, next) {
    try {
      const result = await cardService.checkPhoneExists(req.query.contact);

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Phone existence checked successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if full name already exists in cards
   */
  async checkNameExists(req, res, next) {
    try {
      const result = await cardService.checkNameExists(
        req.query.firstName,
        req.query.middleName,
        req.query.lastName,
      );

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Name existence checked successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if email already exists in cards
   */
  async checkEmailExists(req, res, next) {
    try {
      const result = await cardService.checkEmailExists(req.query.email);

      res
        .status(200)
        .json(
          new ApiResponse(200, result, "Email existence checked successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if Aadhaar number already exists in cards
   */
  async checkAadhaarExists(req, res, next) {
    try {
      const result = await cardService.checkAadhaarExists(
        req.query.aadhaarNumber,
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Aadhaar existence checked successfully",
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

      // Parse documents metadata if it's a string (from multipart/form-data)
      if (typeof cardData.documents === "string") {
        try {
          cardData.documents = JSON.parse(cardData.documents);
        } catch (error) {
          // If parsing fails, ignore documents metadata
        }
      }
      const bodyDocuments = Array.isArray(cardData.documents) ? cardData.documents : [];

      // Handle uploaded documents
      if (req.files && req.files.documents && req.files.documents.length > 0) {
        const useVercelBlob =
          process.env.BLOB_READ_WRITE_TOKEN &&
          (process.env.VERCEL || process.env.NODE_ENV === "production");

        if (useVercelBlob) {
          // Upload to Vercel Blob (production/serverless)
          try {
            const uploaded = await uploadToVercelBlob(req.files.documents);
            cardData.documents = uploaded.map((file, idx) => ({
              name: bodyDocuments[idx]?.name || "",
              ...file,
            }));
          } catch (error) {
            console.error("Vercel Blob upload error:", error);
            throw new Error("Failed to upload documents to cloud storage");
          }
        } else {
          // Local file storage (development)
          cardData.documents = req.files.documents.map((file, idx) => {
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
              name: bodyDocuments[idx]?.name || "",
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
