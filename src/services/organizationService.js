import organizationRepository from "../repositories/organizationRepository.js";
import doctorRepository from "../repositories/doctorRepository.js";
import { ApiError } from "../utils/apiResponse.js";

class OrganizationService {
  /**
   * Create a new organization
   */
  async createOrganization(currentUser, organizationData) {
    // Check if registrationId already exists (if provided)
    if (organizationData.registrationId) {
      const existing = await organizationRepository.findByRegistrationId(
        organizationData.registrationId,
      );
      if (existing) {
        throw new ApiError(
          409,
          "Organization with this registration ID already exists",
        );
      }
    }

    // Add createdBy field
    const dataWithCreator = {
      ...organizationData,
      createdBy: currentUser.userId,
    };

    const organization = await organizationRepository.create(dataWithCreator);
    return organization;
  }

  /**
   * Get organization by ID with doctors
   */
  async getOrganizationById(id) {
    const organization = await organizationRepository.findById(id);

    if (!organization || organization.isDeleted) {
      throw new ApiError(404, "Organization not found");
    }

    // Fetch doctors for this organization
    const doctorsData = await doctorRepository.findByOrganizationId(id, {
      page: 1,
      limit: 1000, // Get all doctors for this organization
      sort: { name: 1 },
    });

    return {
      organization,
      doctors: doctorsData.doctors,
    };
  }

  /**
   * Get all organizations with pagination
   */
  async getAllOrganizations(filters, options) {
    return await organizationRepository.findAll(filters, options);
  }

  /**
   * Update organization by ID
   */
  async updateOrganization(id, updateData) {
    // Don't allow updating certain fields
    delete updateData.createdBy;
    delete updateData._id;

    // Check if registrationId is being updated and already exists
    if (updateData.registrationId) {
      const existing = await organizationRepository.findByRegistrationId(
        updateData.registrationId,
      );
      if (existing && existing._id.toString() !== id) {
        throw new ApiError(
          409,
          "Organization with this registration ID already exists",
        );
      }
    }

    const organization = await organizationRepository.updateById(
      id,
      updateData,
    );

    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    return organization;
  }

  /**
   * Delete organization (soft delete)
   */
  async deleteOrganization(id) {
    const organization = await organizationRepository.deleteById(id);

    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    return { message: "Organization deleted successfully" };
  }
}

export default new OrganizationService();
