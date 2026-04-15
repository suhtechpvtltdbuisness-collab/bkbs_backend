import attendanceService from "../services/attendanceService.js";
import { ApiError, successResponse } from "../utils/apiResponse.js";

class AttendanceController {
  getDateFilters(query) {
    return attendanceService.buildDateFilter({
      date: query.date,
      fromDate: query.fromDate,
      toDate: query.toDate,
    });
  }

  async createAttendance(req, res, next) {
    try {
      const attendance = await attendanceService.createAttendance(
        req.body,
        req.user.userId,
      );

      successResponse(res, 201, "Attendance created successfully", {
        attendance,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllAttendances(req, res, next) {
    try {
      const filters = this.getDateFilters(req.query);

      const options = {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10,
        sort: req.query.sort || "-date",
      };

      const result = await attendanceService.getAllAttendances(
        filters,
        options,
      );

      successResponse(res, 200, "Attendances retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceById(req, res, next) {
    try {
      const attendance = await attendanceService.getAttendanceById(
        req.params.id,
      );

      successResponse(res, 200, "Attendance retrieved successfully", {
        attendance,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceByUserId(req, res, next) {
    try {
      const requestedUserId = req.params.id;
      const isAdmin = req.user.role === "admin";

      if (!isAdmin && req.user.userId !== requestedUserId) {
        throw new ApiError(403, "You can only view your own attendance");
      }

      const dateFilters = this.getDateFilters(req.query);

      const options = {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10,
        sort: req.query.sort || "-date",
      };

      const result = await attendanceService.getAttendanceByUserId(
        requestedUserId,
        dateFilters,
        options,
      );

      successResponse(res, 200, "Attendance retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  async updateAttendance(req, res, next) {
    try {
      const attendance = await attendanceService.updateAttendance(
        req.params.id,
        req.body,
      );

      successResponse(res, 200, "Attendance updated successfully", {
        attendance,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAttendance(req, res, next) {
    try {
      const result = await attendanceService.deleteAttendance(req.params.id);

      successResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new AttendanceController();
