import employeeRepository from "../repositories/employeeRepository.js";
import { ApiError } from "../utils/apiResponse.js";

class EmployeeService {
  /**
   * Create new employee
   */
  async createEmployee(employeeData) {
    // Check if employee already exists for this user
    const existingEmployee = await employeeRepository.findByUserId(
      employeeData.userId,
    );

    if (existingEmployee) {
      throw new ApiError(409, "Employee already exists for this user");
    }

    const employee = await employeeRepository.create(employeeData);
    return employee;
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id) {
    const employee = await employeeRepository.findById(id);

    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    return employee;
  }

  /**
   * Get employee by user ID
   */
  async getEmployeeByUserId(userId) {
    const employee = await employeeRepository.findByUserId(userId);

    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    return employee;
  }

  /**
   * Get all employees under an admin
   */
  async getEmployeesByAdminId(adminId) {
    const employees = await employeeRepository.findByAdminId(adminId);
    return employees;
  }

  /**
   * Get all employees
   */
  async getAllEmployees(filters, options) {
    return await employeeRepository.findAll(filters, options);
  }

  /**
   * Update employee
   */
  async updateEmployee(id, updateData) {
    const employee = await employeeRepository.updateById(id, updateData);

    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    return employee;
  }

  /**
   * Delete employee
   */
  async deleteEmployee(id) {
    const employee = await employeeRepository.deleteById(id);

    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    return { message: "Employee deleted successfully" };
  }
}

export default new EmployeeService();
