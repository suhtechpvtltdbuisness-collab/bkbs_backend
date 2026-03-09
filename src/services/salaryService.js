import salaryRepository from "../repositories/salaryRepository.js";
import employeeRepository from "../repositories/employeeRepository.js";

class SalaryService {
  /**
   * Create new salary record
   */
  async createSalary(salaryData, userId) {
    // Verify employee exists
    const employee = await employeeRepository.findByUserId(
      salaryData.employeeId,
    );
    if (!employee) {
      throw new Error("Employee not found");
    }

    // Add creator info
    const newSalary = {
      ...salaryData,
      createdBy: userId,
    };

    return await salaryRepository.create(newSalary);
  }

  /**
   * Get all salaries with filters and pagination
   */
  async getAllSalaries(filters = {}, options = {}) {
    const query = { isDeleted: false };

    // Apply filters
    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.method) {
      query.method = filters.method;
    }

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.date.$lte = filters.endDate;
      }
    }

    return await salaryRepository.findAll(query, options);
  }

  /**
   * Get salary by ID
   */
  async getSalaryById(id) {
    const salary = await salaryRepository.findById(id);
    if (!salary) {
      throw new Error("Salary record not found");
    }

    if (salary.isDeleted) {
      throw new Error("Salary record has been deleted");
    }

    return salary;
  }

  /**
   * Get salaries by employee ID
   */
  async getSalariesByEmployeeId(employeeId, options = {}) {
    // Verify employee exists
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    return await salaryRepository.findByEmployeeId(employeeId, options);
  }

  /**
   * Get salaries by status
   */
  async getSalariesByStatus(status, options = {}) {
    return await salaryRepository.findByStatus(status, options);
  }

  /**
   * Update salary status and method
   */
  async updateSalaryStatusAndMethod(id, status, method, userId) {
    // Verify salary exists
    const existingSalary = await salaryRepository.findById(id);
    if (!existingSalary) {
      throw new Error("Salary record not found");
    }

    if (existingSalary.isDeleted) {
      throw new Error("Cannot update deleted salary record");
    }

    // Update only the allowed fields
    const updateData = {
      updatedBy: userId,
    };

    if (status !== undefined) {
      updateData.status = status;
    }

    if (method !== undefined) {
      updateData.method = method;
    }

    return await salaryRepository.updateById(id, updateData);
  }

  /**
   * Update salary
   */
  async updateSalary(id, updateData, userId) {
    // Verify salary exists
    const existingSalary = await salaryRepository.findById(id);
    if (!existingSalary) {
      throw new Error("Salary record not found");
    }

    if (existingSalary.isDeleted) {
      throw new Error("Cannot update deleted salary record");
    }

    // If employeeId is being changed, verify the new employee exists
    if (
      updateData.employeeId &&
      updateData.employeeId !== existingSalary.employeeId.toString()
    ) {
      const employee = await employeeRepository.findById(updateData.employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }
    }

    // Add updater info
    updateData.updatedBy = userId;

    return await salaryRepository.updateById(id, updateData);
  }

  /**
   * Delete salary (soft delete)
   */
  async deleteSalary(id) {
    const salary = await salaryRepository.findById(id);
    if (!salary) {
      throw new Error("Salary record not found");
    }

    if (salary.isDeleted) {
      throw new Error("Salary record already deleted");
    }

    return await salaryRepository.softDelete(id);
  }

  /**
   * Get salary statistics
   */
  async getSalaryStatistics(filters = {}) {
    const query = {};

    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.date.$lte = filters.endDate;
      }
    }

    return await salaryRepository.getStatistics(query);
  }
}

export default new SalaryService();
