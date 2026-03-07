import doctorService from "../services/doctorService.js";
import { asyncHandler, successResponse } from "../utils/apiResponse.js";
import { paginate } from "../utils/helpers.js";

/**
 * @desc    Create new doctor
 * @route   POST /api/doctors
 * @access  Private (Admin/Employee)
 */
export const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.createDoctor(req.user, req.body);

  successResponse(res, 201, "Doctor created successfully", { doctor });
});

/**
 * @desc    Get all doctors
 * @route   GET /api/doctors
 * @access  Private
 */
export const getAllDoctors = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const { organizationId } = req.query;

  const filters = {};
  if (organizationId) filters.organizationId = organizationId;

  const options = { page, limit, sort: { createdAt: -1 } };

  const result = await doctorService.getAllDoctors(filters, options);

  successResponse(res, 200, "Doctors retrieved successfully", result);
});

/**
 * @desc    Get doctors by organization
 * @route   GET /api/doctors/organization/:organizationId
 * @access  Private
 */
export const getDoctorsByOrganization = asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query.page, req.query.limit);
  const options = { page, limit, sort: { createdAt: -1 } };

  const result = await doctorService.getDoctorsByOrganization(
    req.params.organizationId,
    options,
  );

  successResponse(res, 200, "Doctors retrieved successfully", result);
});

/**
 * @desc    Get doctor by ID
 * @route   GET /api/doctors/:id
 * @access  Private
 */
export const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await doctorService.getDoctorById(req.params.id);

  successResponse(res, 200, "Doctor retrieved successfully", { doctor });
});

/**
 * @desc    Update doctor
 * @route   PUT /api/doctors/:id
 * @access  Private (Admin/Employee)
 */
export const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.updateDoctor(req.params.id, req.body);

  successResponse(res, 200, "Doctor updated successfully", { doctor });
});

/**
 * @desc    Delete doctor
 * @route   DELETE /api/doctors/:id
 * @access  Private (Admin)
 */
export const deleteDoctor = asyncHandler(async (req, res) => {
  await doctorService.deleteDoctor(req.params.id);

  successResponse(res, 200, "Doctor deleted successfully", null);
});

export default {
  createDoctor,
  getAllDoctors,
  getDoctorsByOrganization,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};
