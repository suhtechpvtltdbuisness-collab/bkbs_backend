import hospitalService from "../services/hospitalService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { paginate } from "../utils/helpers.js";

class HospitalController {
  /**
   * Create new hospital
   */
  async createHospital(req, res, next) {
    try {
      const hospitalData = {
        ...req.body,
        createdBy: req.user.userId,
      };

      const hospital = await hospitalService.createHospital(hospitalData);

      res
        .status(201)
        .json(new ApiResponse(201, hospital, "Hospital created successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get hospital by ID
   */
  async getHospitalById(req, res, next) {
    try {
      const hospital = await hospitalService.getHospitalById(req.params.id);

      res
        .status(200)
        .json(
          new ApiResponse(200, hospital, "Hospital retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all hospitals
   */
  async getAllHospitals(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const filters = {};

      const result = await hospitalService.getAllHospitals(filters, {
        page,
        limit,
      });

      res
        .status(200)
        .json(new ApiResponse(200, result, "Hospitals retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search hospitals
   */
  async searchHospitals(req, res, next) {
    try {
      const { search } = req.query;
      const { page, limit } = paginate(req.query.page, req.query.limit);

      if (!search) {
        return this.getAllHospitals(req, res, next);
      }

      const result = await hospitalService.searchHospitals(search, {
        page,
        limit,
      });

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Hospitals search completed successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update hospital
   */
  async updateHospital(req, res, next) {
    try {
      const hospital = await hospitalService.updateHospital(
        req.params.id,
        req.body,
      );

      res
        .status(200)
        .json(new ApiResponse(200, hospital, "Hospital updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete hospital
   */
  async deleteHospital(req, res, next) {
    try {
      const result = await hospitalService.deleteHospital(req.params.id);

      res
        .status(200)
        .json(new ApiResponse(200, result, "Hospital deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get hospital statistics
   */
  async getHospitalStats(req, res, next) {
    try {
      const stats = await hospitalService.getHospitalStats();

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            stats,
            "Hospital statistics retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }
}

export default new HospitalController();
