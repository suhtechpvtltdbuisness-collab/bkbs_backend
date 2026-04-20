import reportService from "../services/reportService.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getRequester = (req) => ({
  userId: req.user?.userId,
  role: req.user?.role,
});

class ReportController {
  /**
   * Get daily report
   * Query: ?date=YYYY-MM-DD (optional)
   */
  async getDailyReport(req, res, next) {
    try {
      const report = await reportService.getDailyReport(
        req.query.date,
        getRequester(req),
      );

      res
        .status(200)
        .json(
          new ApiResponse(200, report, "Daily report retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get monthly report
   * Query: ?year=YYYY&month=1-12 (optional)
   */
  async getMonthlyReport(req, res, next) {
    try {
      const report = await reportService.getMonthlyReport(
        req.query.year,
        req.query.month,
        getRequester(req),
      );

      res
        .status(200)
        .json(
          new ApiResponse(200, report, "Monthly report retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get yearly report
   * Query: ?year=YYYY (optional)
   */
  async getYearlyReport(req, res, next) {
    try {
      const report = await reportService.getYearlyReport(
        req.query.year,
        getRequester(req),
      );

      res
        .status(200)
        .json(
          new ApiResponse(200, report, "Yearly report retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  // ─── PDF Analytics ────────────────────────────────────────────────────────

  /**
   * Key Summary – Section 1
   * GET /api/reports/summary
   */
  async getKeySummary(req, res, next) {
    try {
      const summary = await reportService.getKeySummary(getRequester(req));
      res
        .status(200)
        .json(
          new ApiResponse(200, summary, "Key summary retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Monthly Trend – Section 2
   * GET /api/reports/monthly-trend?year=YYYY
   */
  async getMonthlyTrend(req, res, next) {
    try {
      const data = await reportService.getMonthlyTrend(
        req.query.year,
        getRequester(req),
      );
      res
        .status(200)
        .json(
          new ApiResponse(200, data, "Monthly trend retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cards by Status – Section 3
   * GET /api/reports/cards/status
   */
  async getCardsByStatus(req, res, next) {
    try {
      const data = await reportService.getCardsByStatus(getRequester(req));
      res
        .status(200)
        .json(
          new ApiResponse(200, data, "Cards by status retrieved successfully"),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Age Group Distribution – Section 4
   * GET /api/reports/cards/age-groups
   */
  async getAgeGroupDistribution(req, res, next) {
    try {
      const data = await reportService.getAgeGroupDistribution(
        getRequester(req),
      );
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            data,
            "Age group distribution retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Location Distribution – Section 6
   * GET /api/reports/cards/location?limit=20
   */
  async getLocationDistribution(req, res, next) {
    try {
      const data = await reportService.getLocationDistribution(
        req.query.limit,
        getRequester(req),
      );
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            data,
            "Location distribution retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Employee Performance – Section 7
   * GET /api/reports/employee-performance?limit=20
   */
  async getEmployeePerformance(req, res, next) {
    try {
      const data = await reportService.getEmployeePerformance(
        req.query.limit,
        getRequester(req),
      );
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            data,
            "Employee performance retrieved successfully",
          ),
        );
    } catch (error) {
      next(error);
    }
  }
}

export default new ReportController();
