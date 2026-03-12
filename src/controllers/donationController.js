import donationService from "../services/donationService.js";
import { ApiResponse } from "../utils/apiResponse.js";

class DonationController {
  /**
   * Create new donation enquiry
   */
  async createDonation(req, res, next) {
    try {
      const donationData = req.body;

      const donation = await donationService.createDonation(donationData);

      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            donation,
            "Donation enquiry created successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get donation by ID
   */
  async getDonationById(req, res, next) {
    try {
      const donation = await donationService.getDonationById(req.params.id);

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            donation,
            "Donation enquiry retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get donation by enquiry ID
   */
  async getDonationByEnquiryId(req, res, next) {
    try {
      const donation = await donationService.getDonationByEnquiryId(
        req.params.enquiryId,
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            donation,
            "Donation enquiry retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all donations with pagination
   */
  async getAllDonations(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Build filters from query params
      const filters = {};
      if (req.query.name) {
        filters.name = { $regex: req.query.name, $options: "i" };
      }
      if (req.query.contact) {
        filters.contact = req.query.contact;
      }
      if (req.query.location) {
        filters.location = { $regex: req.query.location, $options: "i" };
      }

      const options = {
        page,
        limit,
        sort: { createdAt: -1 },
      };

      const result = await donationService.getAllDonations(filters, options);

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Donation enquiries retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update donation
   */
  async updateDonation(req, res, next) {
    try {
      const donation = await donationService.updateDonation(
        req.params.id,
        req.body,
      );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            donation,
            "Donation enquiry updated successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete donation
   */
  async deleteDonation(req, res, next) {
    try {
      const result = await donationService.deleteDonation(req.params.id);

      res.status(200).json(new ApiResponse(200, result, result.message));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get donation statistics
   */
  async getDonationStats(req, res, next) {
    try {
      const stats = await donationService.getDonationStats();

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            stats,
            "Donation statistics retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }
}

export default new DonationController();
