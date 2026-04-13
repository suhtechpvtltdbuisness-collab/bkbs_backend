import Attendance from "../models/Attendance.js";

class AttendanceRepository {
  async create(attendanceData) {
    return await Attendance.create(attendanceData);
  }

  async findById(id) {
    return await Attendance.findById(id).populate(
      "userId",
      "name email role employeeId",
    );
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = "-date" } = options;
    const skip = (page - 1) * limit;

    const query = { ...filters, isDeleted: false };

    const attendances = await Attendance.find(query)
      .populate("userId", "name email role employeeId")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(query);

    return {
      attendances,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(id, updateData) {
    return await Attendance.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("userId", "name email role employeeId");
  }

  async softDeleteById(id) {
    return await Attendance.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true },
    );
  }
}

export default new AttendanceRepository();
