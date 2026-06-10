import employeeRepository from "../repositories/employeeRepository.js";
import settlementRepository from "../repositories/settlementRepository.js";
import cardRepository from "../repositories/cardRepository.js";
import { ApiError } from "../utils/apiResponse.js";

const getDayRange = (dateStr) => {
  let y, m, d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    [y, m, d] = dateStr.split("-").map(Number);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    [d, m, y] = dateStr.split("-").map(Number);
  } else {
    const dt = new Date(dateStr);
    y = dt.getFullYear();
    m = dt.getMonth() + 1;
    d = dt.getDate();
  }
  return {
    start: new Date(y, m - 1, d, 0, 0, 0, 0),
    end: new Date(y, m - 1, d, 23, 59, 59, 999),
  };
};

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

  /**
   * Get per-day settlement list for all employees.
   * Shows number of cards created by each employee for the day and the
   * settlement status (done/pending).
   */
  async getEmployeeSettlements(date, filters = {}, options = {}) {
    const settlementDate = date || new Date().toISOString().slice(0, 10);
    const { start, end } = getDayRange(settlementDate);

    const { employees, pagination } = await employeeRepository.findAll(
      filters,
      options,
    );

    const settlements = await Promise.all(
      employees.map(async (employee) => {
        const user = employee.userId;
        const userId = user?._id?.toString();

        const cardCounts = userId
          ? await cardRepository.countDailyByPaymentMethod(userId, start, end)
          : { total: 0, onlineCards: 0, offlineCards: 0 };

        const settlement = await settlementRepository.findByEmployeeAndDate(
          employee._id,
          settlementDate,
        );

        return {
          employeeId: employee._id,
          employeeCode: user?.employeeId,
          name: user?.name,
          email: user?.email,
          date: settlementDate,
          dayCards: cardCounts.total,
          onlineCards: cardCounts.onlineCards,
          offlineCards: cardCounts.offlineCards,
          amount: settlement?.amount || 0,
          status: settlement?.status === "done" ? "done" : "pending",
        };
      }),
    );

    return { settlements, pagination };
  }

  /**
   * Settle an employee for a given day.
   * Stores the number of cards created by the employee that day and updates
   * the settlement amount and status.
   */
  async settleEmployeeDay({ employeeId, date, amount, status }, userId) {
    const employee = await employeeRepository.findById(employeeId);

    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    const settlementDate = date || new Date().toISOString().slice(0, 10);
    const { start, end } = getDayRange(settlementDate);
    const empUserId = employee.userId?._id?.toString();

    const cardCounts = empUserId
      ? await cardRepository.countDailyByPaymentMethod(empUserId, start, end)
      : { total: 0, onlineCards: 0, offlineCards: 0 };

    const updateData = {
      cardsCount: cardCounts.total,
      onlineCardsCount: cardCounts.onlineCards,
      offlineCardsCount: cardCounts.offlineCards,
      updatedBy: userId,
    };

    if (amount !== undefined) {
      updateData.amount = amount;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    return await settlementRepository.upsert(
      employeeId,
      settlementDate,
      updateData,
      userId,
    );
  }
}

export default new EmployeeService();
