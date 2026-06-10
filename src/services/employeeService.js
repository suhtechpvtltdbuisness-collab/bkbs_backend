import employeeRepository from "../repositories/employeeRepository.js";
import settlementRepository from "../repositories/settlementRepository.js";
import cardRepository from "../repositories/cardRepository.js";
import { ApiError } from "../utils/apiResponse.js";
import { getISTDayRange } from "../utils/helpers.js";

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
    const { start, end, isoDate: settlementDate } = getISTDayRange(date);

    const { employees, pagination } = await employeeRepository.findAll(
      filters,
      options,
    );

    const settlements = await Promise.all(
      employees.map(async (employee) => {
        const user = employee.userId;
        const userId = user?._id?.toString();

        const settlementDetails = userId
          ? await cardRepository.getDailySettlementDetails(
              userId,
              start,
              end,
              settlementDate,
            )
          : {
              total: 0,
              onlineCards: 0,
              offlineCards: 0,
              onlineAmount: 0,
              offlineAmount: 0,
              cards: [],
            };

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
          dayCards: settlementDetails.total,
          onlineCards: settlementDetails.onlineCards,
          offlineCards: settlementDetails.offlineCards,
          onlineAmount: settlementDetails.onlineAmount,
          offlineAmount: settlementDetails.offlineAmount,
          totalCollected:
            settlementDetails.onlineAmount + settlementDetails.offlineAmount,
          cards: settlementDetails.cards,
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

    const { start, end, isoDate: settlementDate } = getISTDayRange(date);
    const empUserId = employee.userId?._id?.toString();

    const settlementDetails = empUserId
      ? await cardRepository.getDailySettlementDetails(
          empUserId,
          start,
          end,
          settlementDate,
        )
      : {
          total: 0,
          onlineCards: 0,
          offlineCards: 0,
          onlineAmount: 0,
          offlineAmount: 0,
          cards: [],
        };

    const updateData = {
      cardsCount: settlementDetails.total,
      onlineCardsCount: settlementDetails.onlineCards,
      offlineCardsCount: settlementDetails.offlineCards,
      onlineAmount: settlementDetails.onlineAmount,
      offlineAmount: settlementDetails.offlineAmount,
      updatedBy: userId,
    };

    if (amount !== undefined) {
      updateData.amount = amount;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const settlement = await settlementRepository.upsert(
      employeeId,
      settlementDate,
      updateData,
      userId,
    );

    return {
      ...(settlement?.toObject ? settlement.toObject() : settlement),
      cards: settlementDetails.cards,
    };
  }
}

export default new EmployeeService();
