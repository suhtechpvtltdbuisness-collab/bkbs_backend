import attendanceRepository from "../repositories/attendanceRepository.js";
import campRepository from "../repositories/campRepository.js";
import { ApiError } from "../utils/apiResponse.js";

class AttendanceService {
  buildDateFilter({ date, fromDate, toDate } = {}) {
    const parsedDate = date ? new Date(date) : null;
    const parsedFromDate = fromDate ? new Date(fromDate) : null;
    const parsedToDate = toDate ? new Date(toDate) : null;

    if (date && Number.isNaN(parsedDate.getTime())) {
      throw new ApiError(400, "Invalid date query parameter");
    }

    if (fromDate && Number.isNaN(parsedFromDate.getTime())) {
      throw new ApiError(400, "Invalid fromDate query parameter");
    }

    if (toDate && Number.isNaN(parsedToDate.getTime())) {
      throw new ApiError(400, "Invalid toDate query parameter");
    }

    if (parsedFromDate && parsedToDate && parsedFromDate > parsedToDate) {
      throw new ApiError(400, "fromDate cannot be greater than toDate");
    }

    if (parsedDate) {
      const start = new Date(parsedDate);
      start.setUTCHours(0, 0, 0, 0);

      const end = new Date(parsedDate);
      end.setUTCHours(23, 59, 59, 999);

      return { date: { $gte: start, $lte: end } };
    }

    if (!parsedFromDate && !parsedToDate) {
      return {};
    }

    const range = {};
    if (parsedFromDate) {
      parsedFromDate.setUTCHours(0, 0, 0, 0);
      range.$gte = parsedFromDate;
    }

    if (parsedToDate) {
      parsedToDate.setUTCHours(23, 59, 59, 999);
      range.$lte = parsedToDate;
    }

    return { date: range };
  }

  toRadians(value) {
    return (value * Math.PI) / 180;
  }

  distanceInMeters(lat1, long1, lat2, long2) {
    const earthRadius = 6371000;
    const dLat = this.toRadians(lat2 - lat1);
    const dLong = this.toRadians(long2 - long1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLong / 2) *
        Math.sin(dLong / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  async createAttendance(attendanceData, userId) {
    const camp = await campRepository.findById(attendanceData.campId);

    if (!camp || camp.isDeleted) {
      throw new ApiError(404, "Camp not found");
    }

    const distance = this.distanceInMeters(
      Number(attendanceData.currentLat),
      Number(attendanceData.currentLong),
      Number(camp.lat),
      Number(camp.long),
    );

    if (distance > 400) {
      throw new ApiError(
        400,
        "Attendance can only be marked within 400 meters of the camp",
      );
    }

    const payload = {
      campId: camp._id,
      userId,
      lat: Number(attendanceData.currentLat),
      long: Number(attendanceData.currentLong),
      state: camp.state,
      city: camp.city,
      status: "present",
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

  async getAttendanceByUserId(userId, filters = {}, options = {}) {
    return await attendanceRepository.findAll({ userId, ...filters }, options);
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
