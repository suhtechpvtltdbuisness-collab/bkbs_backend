import doctorRepository from "../repositories/doctorRepository.js";
import organizationRepository from "../repositories/organizationRepository.js";
import { ApiError } from "../utils/apiResponse.js";

class DoctorService {
  /**
   * Create a new doctor
   */
  async createDoctor(currentUser, doctorData) {
    // Verify organization exists
    const organization = await organizationRepository.findById(
      doctorData.organizationId,
    );
    if (!organization || organization.isDeleted) {
      throw new ApiError(404, "Organization not found");
    }

    // Add createdBy field
    const dataWithCreator = {
      ...doctorData,
      createdBy: currentUser.userId,
    };

    const doctor = await doctorRepository.create(dataWithCreator);
    return doctor;
  }

  /**
   * Get doctor by ID
   */
  async getDoctorById(id) {
    const doctor = await doctorRepository.findById(id);

    if (!doctor || doctor.isDeleted) {
      throw new ApiError(404, "Doctor not found");
    }

    return doctor;
  }

  /**
   * Get all doctors with pagination
   */
  async getAllDoctors(filters, options) {
    return await doctorRepository.findAll(filters, options);
  }

  /**
   * Get doctors by organization ID
   */
  async getDoctorsByOrganization(organizationId, options) {
    // Verify organization exists
    const organization = await organizationRepository.findById(organizationId);
    if (!organization || organization.isDeleted) {
      throw new ApiError(404, "Organization not found");
    }

    return await doctorRepository.findByOrganizationId(organizationId, options);
  }

  /**
   * Update doctor by ID
   */
  async updateDoctor(id, updateData) {
    // Don't allow updating certain fields
    delete updateData.createdBy;
    delete updateData._id;

    // If organizationId is being updated, verify it exists
    if (updateData.organizationId) {
      const organization = await organizationRepository.findById(
        updateData.organizationId,
      );
      if (!organization || organization.isDeleted) {
        throw new ApiError(404, "Organization not found");
      }
    }

    const doctor = await doctorRepository.updateById(id, updateData);

    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    return doctor;
  }

  /**
   * Delete doctor (soft delete)
   */
  async deleteDoctor(id) {
    const doctor = await doctorRepository.deleteById(id);

    if (!doctor) {
      throw new ApiError(404, "Doctor not found");
    }

    return { message: "Doctor deleted successfully" };
  }
}

export default new DoctorService();
