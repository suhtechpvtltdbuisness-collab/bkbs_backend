import campRepository from "../repositories/campRepository.js";
import { ApiError } from "../utils/apiResponse.js";

class CampService {
  async createCamp(currentUser, campData) {
    const camp = await campRepository.create({
      ...campData,
      createdBy: currentUser.userId,
    });

    return camp;
  }

  async getCampById(id) {
    const camp = await campRepository.findById(id);

    if (!camp || camp.isDeleted) {
      throw new ApiError(404, "Camp not found");
    }

    return camp;
  }

  async getAllCamps(filters, options) {
    return await campRepository.findAll(filters, options);
  }

  async updateCamp(id, updateData) {
    delete updateData.createdBy;
    delete updateData.isDeleted;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const camp = await campRepository.updateById(id, updateData);

    if (!camp || camp.isDeleted) {
      throw new ApiError(404, "Camp not found");
    }

    return camp;
  }

  async deleteCamp(id) {
    const camp = await campRepository.softDeleteById(id);

    if (!camp) {
      throw new ApiError(404, "Camp not found");
    }

    return { message: "Camp deleted successfully" };
  }
}

export default new CampService();
