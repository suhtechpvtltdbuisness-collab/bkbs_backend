import hospitalRepository from "../repositories/hospitalRepository.js";
import { ApiError } from "../utils/apiResponse.js";

class HospitalService {
  /**
   * Create new hospital
   */
  async createHospital(hospitalData) {
    const hospital = await hospitalRepository.create(hospitalData);
    return hospital;
  }

  /**
   * Get hospital by ID
   */
  async getHospitalById(id) {
    const hospital = await hospitalRepository.findById(id);

    if (!hospital || hospital.isDeleted) {
      throw new ApiError(404, "Hospital not found");
    }

    return hospital;
  }

  /**
   * Get all hospitals
   */
  async getAllHospitals(filters, options) {
    return await hospitalRepository.findAll(filters, options);
  }

  /**
   * Search hospitals
   */
  async searchHospitals(searchTerm, options) {
    return await hospitalRepository.search(searchTerm, options);
  }

  /**
   * Update hospital
   */
  async updateHospital(id, updateData) {
    // Prevent updating createdBy
    delete updateData.createdBy;

    const hospital = await hospitalRepository.updateById(id, updateData);

    if (!hospital || hospital.isDeleted) {
      throw new ApiError(404, "Hospital not found");
    }

    return hospital;
  }

  /**
   * Delete hospital
   */
  async deleteHospital(id) {
    const hospital = await hospitalRepository.softDeleteById(id);

    if (!hospital) {
      throw new ApiError(404, "Hospital not found");
    }

    return { message: "Hospital deleted successfully" };
  }

  /**
   * Get hospital statistics
   */
  async getHospitalStats() {
    const totalHospitals = await hospitalRepository.count();

    return {
      total: totalHospitals,
    };
  }
}

export default new HospitalService();
