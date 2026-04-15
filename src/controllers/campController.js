import campService from "../services/campService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { paginate } from "../utils/helpers.js";

class CampController {
  async createCamp(req, res, next) {
    try {
      const camp = await campService.createCamp(req.user, req.body);

      res
        .status(201)
        .json(new ApiResponse(201, camp, "Camp created successfully"));
    } catch (error) {
      next(error);
    }
  }

  async getCampById(req, res, next) {
    try {
      const camp = await campService.getCampById(req.params.id);

      res
        .status(200)
        .json(new ApiResponse(200, camp, "Camp retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  async getAllCamps(req, res, next) {
    try {
      const { page, limit } = paginate(req.query.page, req.query.limit);
      const result = await campService.getAllCamps({}, { page, limit });

      res
        .status(200)
        .json(new ApiResponse(200, result, "Camps retrieved successfully"));
    } catch (error) {
      next(error);
    }
  }

  async updateCamp(req, res, next) {
    try {
      const camp = await campService.updateCamp(req.params.id, req.body);

      res
        .status(200)
        .json(new ApiResponse(200, camp, "Camp updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  async deleteCamp(req, res, next) {
    try {
      const result = await campService.deleteCamp(req.params.id);

      res
        .status(200)
        .json(new ApiResponse(200, result, "Camp deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}

export default new CampController();
