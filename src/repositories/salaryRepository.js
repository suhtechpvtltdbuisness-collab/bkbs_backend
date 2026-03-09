import Salary from "../models/Salary.js";

class SalaryRepository {
  /**
   * Create new salary record
   */
  async create(salaryData) {
    return await Salary.create(salaryData);
  }

  /**
   * Find salary by ID
   */
  async findById(id) {
    return await Salary.findById(id)
      .populate("employeeId", "userId")
      .populate("createdBy", "name email employeeId")
      .populate("updatedBy", "name email employeeId");
  }

  /**
   * Find all salaries with filters
   */
  async findAll(filter = {}, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      populate = true,
    } = options;

    const query = Salary.find(filter);

    if (populate) {
      query
        .populate("employeeId", "userId")
        .populate("createdBy", "name email employeeId")
        .populate("updatedBy", "name email employeeId");
    }

    const salaries = await query
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Salary.countDocuments(filter);

    return {
      salaries,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find salaries by employee ID
   */
  async findByEmployeeId(employeeId, options = {}) {
    return await this.findAll({ employeeId, isDeleted: false }, options);
  }

  /**
   * Find salaries by status
   */
  async findByStatus(status, options = {}) {
    return await this.findAll({ status, isDeleted: false }, options);
  }

  /**
   * Update salary by ID
   */
  async updateById(id, updateData) {
    return await Salary.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("employeeId", "userId")
      .populate("createdBy", "name email employeeId")
      .populate("updatedBy", "name email employeeId");
  }

  /**
   * Update salary status and method
   */
  async updateStatusAndMethod(id, status, method, updatedBy) {
    return await Salary.findByIdAndUpdate(
      id,
      { status, method, updatedBy },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("employeeId", "userId")
      .populate("createdBy", "name email employeeId")
      .populate("updatedBy", "name email employeeId");
  }

  /**
   * Soft delete salary
   */
  async softDelete(id) {
    return await Salary.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
  }

  /**
   * Hard delete salary
   */
  async delete(id) {
    return await Salary.findByIdAndDelete(id);
  }

  /**
   * Get salary statistics
   */
  async getStatistics(filter = {}) {
    const stats = await Salary.aggregate([
      { $match: { ...filter, isDeleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const total = await Salary.countDocuments({ ...filter, isDeleted: false });
    const totalAmount = await Salary.aggregate([
      { $match: { ...filter, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return {
      byStatus: stats,
      total,
      totalAmount: totalAmount[0]?.total || 0,
    };
  }
}

export default new SalaryRepository();
