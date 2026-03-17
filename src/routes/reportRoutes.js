import express from "express";
import reportController from "../controllers/reportController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// All report routes require authentication + admin role
router.use(authenticate);
router.use(authorize("admin"));

// ─── Range Reports ────────────────────────────────────────────────────────────
// GET /api/reports/daily?date=YYYY-MM-DD
router.get("/daily", reportController.getDailyReport);
// GET /api/reports/monthly?year=YYYY&month=1-12
router.get("/monthly", reportController.getMonthlyReport);
// GET /api/reports/yearly?year=YYYY
router.get("/yearly", reportController.getYearlyReport);

// ─── PDF Analytics Reports ────────────────────────────────────────────────────
// Section 1 – Key Summary
// GET /api/reports/summary
router.get("/summary", reportController.getKeySummary);

// Section 2 – Monthly Trend (all 12 months for a year)
// GET /api/reports/monthly-trend?year=YYYY
router.get("/monthly-trend", reportController.getMonthlyTrend);

// Section 3 – Cards by Status distribution
// GET /api/reports/cards/status
router.get("/cards/status", reportController.getCardsByStatus);

// Section 4 – Age Group distribution (uses dob field)
// GET /api/reports/cards/age-groups
router.get("/cards/age-groups", reportController.getAgeGroupDistribution);

// Section 6 – Location distribution (grouped by pincode)
// GET /api/reports/cards/location?limit=20
router.get("/cards/location", reportController.getLocationDistribution);

// Section 7 – Field Employee performance (cards per creator)
// GET /api/reports/employee-performance?limit=20
router.get("/employee-performance", reportController.getEmployeePerformance);

export default router;
