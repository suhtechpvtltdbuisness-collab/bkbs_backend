import partnerService from "../services/partnerService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { paginate } from "../utils/helpers.js";

class PartnerController {
  /**
   * Create new partner
   */
  async createPartner(req, res, next) {
    try {
      const partnerData = {
        ...req.body,
        createdBy: req.user.userId,
      };

      const partner = await partnerService.createPartner(partnerData);

      res
        .status(201)
        .json(new ApiResponse(201, partner, "Partner created successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get partner by ID
   */
  async getPartnerById(req, res, next) {
    try {
      const partner = await partnerService.getPartnerById(req.params.id);

      res
        .status(200)
        .json(new ApiResponse(200, partner, "Partner retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all partners
   */
  async getAllPartners(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const filters = {};

      if (req.query.location) {
        filters.location = req.query.location;
      }

      const result = await partnerService.getAllPartners(filters, {
        page,
        limit,
      });

      res
        .status(200)
        .json(new ApiResponse(200, result, "Partners retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search partners
   */
  async searchPartners(req, res, next) {
    try {
      const { search } = req.query;
      const { page, limit } = paginate(req.query.page, req.query.limit);

      if (!search) {
        return this.getAllPartners(req, res, next);
      }

      const result = await partnerService.searchPartners(search, {
        page,
        limit,
      });

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Partners search completed successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get partners by location
   */
  async getPartnersByLocation(req, res, next) {
    try {
      const { location } = req.params;
      const { page, limit } = paginate(req.query.page, req.query.limit);

      const result = await partnerService.getPartnersByLocation(location, {
        page,
        limit,
      });

      res
        .status(200)
        .json(new ApiResponse(200, result, "Partners retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update partner
   */
  async updatePartner(req, res, next) {
    try {
      const partner = await partnerService.updatePartner(
        req.params.id,
        req.body,
      );

      res
        .status(200)
        .json(new ApiResponse(200, partner, "Partner updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete partner
   */
  async deletePartner(req, res, next) {
    try {
      const result = await partnerService.deletePartner(req.params.id);

      res
        .status(200)
        .json(new ApiResponse(200, result, "Partner deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get partner statistics
   */
  async getPartnerStats(req, res, next) {
    try {
      const stats = await partnerService.getPartnerStats();

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            stats,
            "Partner statistics retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }
}

export default new PartnerController();
