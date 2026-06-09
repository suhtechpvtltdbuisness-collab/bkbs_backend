import employeeService from "../services/employeeService.js";
import { successResponse } from "../utils/apiResponse.js";

class EmployeeController {
  /**
   * Get per-day settlement list for employees
   * GET /api/employees/settlements
   */
  async getEmployeeSettlements(req, res, next) {
    try {
      const filters = {};
      if (req.query.adminId) {
        filters.adminId = req.query.adminId;
      }

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      const result = await employeeService.getEmployeeSettlements(
        req.query.date,
        filters,
        options,
      );

      successResponse(res, 200, "Employee settlements retrieved successfully", {
        settlements: result.settlements,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Settle an employee for a given day
   * POST /api/employees/settlements
   */
  async settleEmployeeDay(req, res, next) {
    try {
      const settlement = await employeeService.settleEmployeeDay(
        req.body,
        req.user.userId,
      );

      successResponse(res, 200, "Employee settlement updated successfully", {
        settlement,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new EmployeeController();
