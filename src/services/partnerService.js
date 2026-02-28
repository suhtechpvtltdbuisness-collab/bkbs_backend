import partnerRepository from "../repositories/partnerRepository.js";
import { ApiError } from "../utils/apiResponse.js";

class PartnerService {
  /**
   * Create new partner
   */
  async createPartner(partnerData) {
    const partner = await partnerRepository.create(partnerData);
    return partner;
  }

  /**
   * Get partner by ID
   */
  async getPartnerById(id) {
    const partner = await partnerRepository.findById(id);

    if (!partner || partner.isDeleted) {
      throw new ApiError(404, "Partner not found");
    }

    return partner;
  }

  /**
   * Get all partners
   */
  async getAllPartners(filters, options) {
    return await partnerRepository.findAll(filters, options);
  }

  /**
   * Search partners
   */
  async searchPartners(searchTerm, options) {
    return await partnerRepository.search(searchTerm, options);
  }

  /**
   * Get partners by location
   */
  async getPartnersByLocation(location, options) {
    return await partnerRepository.findByLocation(location, options);
  }

  /**
   * Update partner
   */
  async updatePartner(id, updateData) {
    // Prevent updating createdBy
    delete updateData.createdBy;

    const partner = await partnerRepository.updateById(id, updateData);

    if (!partner || partner.isDeleted) {
      throw new ApiError(404, "Partner not found");
    }

    return partner;
  }

  /**
   * Delete partner
   */
  async deletePartner(id) {
    const partner = await partnerRepository.softDeleteById(id);

    if (!partner) {
      throw new ApiError(404, "Partner not found");
    }

    return { message: "Partner deleted successfully" };
  }

  /**
   * Get partner statistics
   */
  async getPartnerStats() {
    const totalPartners = await partnerRepository.count();

    return {
      total: totalPartners,
    };
  }
}

export default new PartnerService();
