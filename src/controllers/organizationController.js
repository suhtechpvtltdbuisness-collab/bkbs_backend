import organizationService from "../services/organizationService.js";
import { asyncHandler, successResponse } from "../utils/apiResponse.js";
import { paginate } from "../utils/helpers.js";

/**
 * @desc    Create new organization
 * @route   POST /api/organizations
 * @access  Private (Admin/Employee)
 */
export const createOrganization = asyncHandler(async (req, res) => {
  const organization = await organizationService.createOrganization(
    req.user,
    req.body,
  );

  successResponse(res, 201, "Organization created successfully", {
    organization,
  });
});

/**
 * @desc    Get all organizations
 * @route   GET /api/organizations
 * @access  Private
 */
export const getAllOrganizations = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);

  const filters = {};
  const options = { page, limit, sort: { createdAt: -1 } };

  const result = await organizationService.getAllOrganizations(
    filters,
    options,
  );

  successResponse(res, 200, "Organizations retrieved successfully", result);
});

/**
 * @desc    Get organization by ID with doctors
 * @route   GET /api/organizations/:id
 * @access  Private
 */
export const getOrganizationById = asyncHandler(async (req, res) => {
  const result = await organizationService.getOrganizationById(req.params.id);

  successResponse(res, 200, "Organization retrieved successfully", result);
});

/**
 * @desc    Update organization
 * @route   PUT /api/organizations/:id
 * @access  Private (Admin/Employee)
 */
export const updateOrganization = asyncHandler(async (req, res) => {
  const organization = await organizationService.updateOrganization(
    req.params.id,
    req.body,
  );

  successResponse(res, 200, "Organization updated successfully", {
    organization,
  });
});

/**
 * @desc    Delete organization
 * @route   DELETE /api/organizations/:id
 * @access  Private (Admin)
 */
export const deleteOrganization = asyncHandler(async (req, res) => {
  await organizationService.deleteOrganization(req.params.id);

  successResponse(res, 200, "Organization deleted successfully", null);
});

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/organizations/dashboard/stats
 * @access  Private (Admin)
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await organizationService.getDashboardStats();

  successResponse(res, 200, "Dashboard statistics retrieved successfully", {
    stats,
  });
});

export default {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getDashboardStats,
};
