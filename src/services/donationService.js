import donationRepository from "../repositories/donationRepository.js";
import { ApiError } from "../utils/apiResponse.js";
import { generateEnquiryId } from "../utils/idGenerator.js";

class DonationService {
  /**
   * Create new donation enquiry
   */
  async createDonation(donationData) {
    // Auto-generate enquiryId
    donationData.enquiryId = await generateEnquiryId();

    // Set date to current date if not provided
    if (!donationData.date) {
      const today = new Date().toISOString().split("T")[0];
      donationData.date = today;
    }

    const donation = await donationRepository.create(donationData);
    return donation;
  }

  /**
   * Get donation by ID
   */
  async getDonationById(id) {
    const donation = await donationRepository.findById(id);

    if (!donation || donation.isDeleted) {
      throw new ApiError(404, "Donation enquiry not found");
    }

    return donation;
  }

  /**
   * Get donation by enquiry ID
   */
  async getDonationByEnquiryId(enquiryId) {
    const donation = await donationRepository.findByEnquiryId(enquiryId);

    if (!donation) {
      throw new ApiError(404, "Donation enquiry not found");
    }

    return donation;
  }

  /**
   * Get all donations
   */
  async getAllDonations(filters, options) {
    return await donationRepository.findAll(filters, options);
  }

  /**
   * Update donation
   */
  async updateDonation(id, updateData) {
    // Prevent updating enquiryId
    if (updateData.enquiryId) {
      throw new ApiError(400, "Enquiry ID cannot be updated");
    }

    const donation = await donationRepository.updateById(id, updateData);

    if (!donation || donation.isDeleted) {
      throw new ApiError(404, "Donation enquiry not found");
    }

    return donation;
  }

  /**
   * Delete donation
   */
  async deleteDonation(id) {
    const donation = await donationRepository.softDeleteById(id);

    if (!donation) {
      throw new ApiError(404, "Donation enquiry not found");
    }

    return { message: "Donation enquiry deleted successfully" };
  }

  /**
   * Get donation statistics
   */
  async getDonationStats() {
    const totalDonations = await donationRepository.count();

    return {
      total: totalDonations,
    };
  }
}

export default new DonationService();
