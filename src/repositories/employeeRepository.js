import Employee from "../models/Employee.js";

class EmployeeRepository {
  async create(employeeData) {
    const employee = new Employee(employeeData);
    return await employee.save();
  }

  async findById(id) {
    return await Employee.findById(id).populate("userId adminId");
  }

  async findByUserId(userId) {
    return await Employee.findOne({ userId }).populate("userId adminId");
  }

  async findByAdminId(adminId) {
    return await Employee.find({ adminId }).populate("userId adminId");
  }

  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

    const skip = (page - 1) * limit;

    const employees = await Employee.find(filters)
      .populate("userId adminId")
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments(filters);

    return {
      employees,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateById(id, updateData) {
    return await Employee.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("userId adminId");
  }

  async deleteById(id) {
    return await Employee.findByIdAndDelete(id);
  }

  async exists(filter) {
    return await Employee.exists(filter);
  }

  async count(filter = {}) {
    return await Employee.countDocuments(filter);
  }
}

export default new EmployeeRepository();
