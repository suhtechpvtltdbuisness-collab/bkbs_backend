import attendanceRepository from "../repositories/attendanceRepository.js";
import { ApiError } from "../utils/apiResponse.js";

class AttendanceService {
  async createAttendance(attendanceData, userId) {
    const payload = {
      ...attendanceData,
      userId,
      date: new Date(),
    };

    return await attendanceRepository.create(payload);
  }

  async getAllAttendances(filters = {}, options = {}) {
    return await attendanceRepository.findAll(filters, options);
  }

  async getAttendanceById(id) {
    const attendance = await attendanceRepository.findById(id);

    if (!attendance || attendance.isDeleted) {
      throw new ApiError(404, "Attendance not found");
    }

    return attendance;
  }

  async getAttendanceByUserId(userId, options = {}) {
    return await attendanceRepository.findAll({ userId }, options);
  }

  async updateAttendance(id, updateData) {
    if (updateData.userId) {
      throw new ApiError(400, "userId cannot be updated");
    }

    const existingAttendance = await attendanceRepository.findById(id);
    if (!existingAttendance || existingAttendance.isDeleted) {
      throw new ApiError(404, "Attendance not found");
    }

    const attendance = await attendanceRepository.updateById(id, updateData);
    return attendance;
  }

  async deleteAttendance(id) {
    const existingAttendance = await attendanceRepository.findById(id);
    if (!existingAttendance || existingAttendance.isDeleted) {
      throw new ApiError(404, "Attendance not found");
    }

    await attendanceRepository.softDeleteById(id);
    return { message: "Attendance deleted successfully" };
  }
}

export default new AttendanceService();
