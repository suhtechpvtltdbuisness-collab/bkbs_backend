import salaryService from "../services/salaryService.js";
import { successResponse } from "../utils/apiResponse.js";

class SalaryController {
  /**
   * Create new salary record
   * POST /api/salaries
   */
  async createSalary(req, res, next) {
    try {
      const salary = await salaryService.createSalary(
        req.body,
        req.user.userId,
      );

      successResponse(res, 201, "Salary record created successfully", {
        salary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all salaries with filters and pagination
   * GET /api/salaries
   */
  async getAllSalaries(req, res, next) {
    try {
      const filters = {
        employeeId: req.query.employeeId,
        status: req.query.status,
        method: req.query.method,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || "-createdAt",
      };

      const result = await salaryService.getAllSalaries(filters, options);

      successResponse(res, 200, "Salaries retrieved successfully", {
        salaries: result.salaries,
        pagination: {
          page: result.page,
          limit: options.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get salary by ID
   * GET /api/salaries/:id
   */
  async getSalaryById(req, res, next) {
    try {
      const salary = await salaryService.getSalaryById(req.params.id);

      successResponse(res, 200, "Salary record retrieved successfully", {
        salary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get salaries by employee ID
   * GET /api/salaries/employee/:employeeId
   */
  async getSalariesByEmployeeId(req, res, next) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || "-createdAt",
      };

      const result = await salaryService.getSalariesByEmployeeId(
        req.params.employeeId,
        options,
      );

      successResponse(res, 200, "Employee salaries retrieved successfully", {
        salaries: result.salaries,
        pagination: {
          page: result.page,
          limit: options.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update salary status and method
   * PATCH /api/salaries/:id/status
   */
  async updateSalaryStatusAndMethod(req, res, next) {
    try {
      const { status, method } = req.body;

      const salary = await salaryService.updateSalaryStatusAndMethod(
        req.params.id,
        status,
        method,
        req.user.userId,
      );

      successResponse(res, 200, "Salary status/method updated successfully", {
        salary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update salary record
   * PUT /api/salaries/:id
   */
  async updateSalary(req, res, next) {
    try {
      const salary = await salaryService.updateSalary(
        req.params.id,
        req.body,
        req.user.userId,
      );

      successResponse(res, 200, "Salary record updated successfully", {
        salary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete salary record (soft delete)
   * DELETE /api/salaries/:id
   */
  async deleteSalary(req, res, next) {
    try {
      await salaryService.deleteSalary(req.params.id);

      successResponse(res, 200, "Salary record deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get salary statistics
   * GET /api/salaries/stats
   */
  async getSalaryStatistics(req, res, next) {
    try {
      const filters = {
        employeeId: req.query.employeeId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const stats = await salaryService.getSalaryStatistics(filters);

      successResponse(res, 200, "Salary statistics retrieved successfully", {
        stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SalaryController();
