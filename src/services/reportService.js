import Card from "../models/Card.js";
import Donation from "../models/Donation.js";
import Organization from "../models/Organization.js";
import Employee from "../models/Employee.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiResponse.js";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const AGE_GROUPS = ["0-18", "19-35", "36-50", "51-65", "65+"];

class ReportService {
  getRequestScope(authUser) {
    const isEmployee = authUser?.role === "employee";

    if (!isEmployee) {
      return { isEmployee: false };
    }

    if (!authUser?.userId) {
      throw new ApiError(401, "Invalid authenticated user");
    }

    const createdByValues = [authUser.userId];

    if (mongoose.Types.ObjectId.isValid(authUser.userId)) {
      createdByValues.push(new mongoose.Types.ObjectId(authUser.userId));
    }

    return {
      isEmployee: true,
      userId: authUser.userId,
      cardCreatedByFilter: { $in: createdByValues },
    };
  }

  getCardBaseMatch(scope) {
    const baseMatch = { isDeleted: false };

    if (scope.isEmployee) {
      baseMatch.createdBy = scope.cardCreatedByFilter;
    }

    return baseMatch;
  }

  parseDailyRange(dateString) {
    if (!dateString) {
      const now = new Date();
      const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      return { start, end, period: start.toISOString().split("T")[0] };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      throw new ApiError(400, "Invalid date format. Use YYYY-MM-DD");
    }

    const start = new Date(`${dateString}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
      throw new ApiError(400, "Invalid date provided");
    }

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return { start, end, period: dateString };
  }

  parseMonthlyRange(yearInput, monthInput) {
    const now = new Date();
    const year = yearInput ? parseInt(yearInput, 10) : now.getUTCFullYear();
    const month = monthInput ? parseInt(monthInput, 10) : now.getUTCMonth() + 1;

    if (!Number.isInteger(year) || year < 1900 || year > 3000) {
      throw new ApiError(400, "Invalid year provided");
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new ApiError(400, "Invalid month provided. Use 1-12");
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    return { start, end, period: `${year}-${String(month).padStart(2, "0")}` };
  }

  parseYearlyRange(yearInput) {
    const now = new Date();
    const year = yearInput ? parseInt(yearInput, 10) : now.getUTCFullYear();

    if (!Number.isInteger(year) || year < 1900 || year > 3000) {
      throw new ApiError(400, "Invalid year provided");
    }

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    return { start, end, period: String(year) };
  }

  async buildReport(start, end, period, reportType, authUser) {
    const scope = this.getRequestScope(authUser);
    const rangeFilter = { createdAt: { $gte: start, $lt: end } };
    const cardRangeFilter = {
      ...this.getCardBaseMatch(scope),
      ...rangeFilter,
    };
    const organizationRangeFilter = scope.isEmployee
      ? {
          ...rangeFilter,
          isDeleted: false,
          createdBy: scope.userId,
        }
      : { ...rangeFilter, isDeleted: false };

    const employeeCountPromise = scope.isEmployee
      ? Promise.resolve(0)
      : Employee.countDocuments(rangeFilter);

    const donationCountPromise = scope.isEmployee
      ? Promise.resolve(0)
      : Donation.countDocuments({ ...rangeFilter, isDeleted: false });

    const [
      totalCards,
      verifiedCards,
      unverifiedCards,
      totalOrganizations,
      totalDonations,
      totalEmployees,
    ] = await Promise.all([
      Card.countDocuments(cardRangeFilter),
      Card.countDocuments({
        ...cardRangeFilter,
        status: { $in: ["approved", "active"] },
      }),
      Card.countDocuments({
        ...cardRangeFilter,
        status: "pending",
      }),
      Organization.countDocuments(organizationRangeFilter),
      donationCountPromise,
      employeeCountPromise,
    ]);

    return {
      reportType,
      period,
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      metrics: {
        totalCards,
        verifiedCards,
        unverifiedCards,
        totalOrganizations,
        totalDonations,
        totalEmployees,
      },
    };
  }

  async getDailyReport(dateString, authUser) {
    const { start, end, period } = this.parseDailyRange(dateString);
    return await this.buildReport(start, end, period, "daily", authUser);
  }

  async getMonthlyReport(year, month, authUser) {
    const { start, end, period } = this.parseMonthlyRange(year, month);
    return await this.buildReport(start, end, period, "monthly", authUser);
  }

  async getYearlyReport(year, authUser) {
    const { start, end, period } = this.parseYearlyRange(year);
    return await this.buildReport(start, end, period, "yearly", authUser);
  }

  // ─── PDF Analytics ────────────────────────────────────────────────────────

  /**
   * Section 1 – Key Summary
   * Returns total cards, verified, pending, and cards expiring within 30 days
   */
  async getKeySummary(authUser) {
    const scope = this.getRequestScope(authUser);
    const cardMatch = this.getCardBaseMatch(scope);
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [totalCards, verifiedCards, pendingCards, expiringSoonResult] =
      await Promise.all([
        Card.countDocuments(cardMatch),
        Card.countDocuments({
          ...cardMatch,
          status: { $in: ["approved", "active"] },
        }),
        Card.countDocuments({ ...cardMatch, status: "pending" }),
        Card.aggregate([
          {
            $match: {
              ...cardMatch,
              status: { $in: ["approved", "active"] },
              cardExpiredDate: { $exists: true, $nin: [null, ""] },
            },
          },
          {
            $addFields: {
              parsedExpiry: {
                $dateFromString: {
                  dateString: "$cardExpiredDate",
                  onError: null,
                  onNull: null,
                },
              },
            },
          },
          {
            $match: {
              parsedExpiry: { $gte: now, $lte: in30Days },
            },
          },
          { $count: "count" },
        ]),
      ]);

    const rejectedCards = await Card.countDocuments({
      ...cardMatch,
      status: "rejected",
    });

    return {
      totalCards,
      verifiedCards,
      pendingCards,
      rejectedCards,
      expiringSoon: expiringSoonResult[0]?.count ?? 0,
    };
  }

  /**
   * Section 2 – Monthly Trend
   * Month-by-month count of new cards issued for the given year
   */
  async getMonthlyTrend(yearInput, authUser) {
    const scope = this.getRequestScope(authUser);
    const cardMatch = this.getCardBaseMatch(scope);
    const now = new Date();
    const year = yearInput ? parseInt(yearInput, 10) : now.getUTCFullYear();

    if (!Number.isInteger(year) || year < 1900 || year > 3000) {
      throw new ApiError(400, "Invalid year provided");
    }

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const rows = await Card.aggregate([
      {
        $match: {
          ...cardMatch,
          createdAt: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const trend = MONTH_NAMES.map((month, i) => {
      const found = rows.find((r) => r._id === i + 1);
      return { month, monthNumber: i + 1, cardsIssued: found?.count ?? 0 };
    });

    return { year, trend };
  }

  /**
   * Section 3 – Cards by Status
   * Count and percentage for every card status
   */
  async getCardsByStatus(authUser) {
    const scope = this.getRequestScope(authUser);
    const cardMatch = this.getCardBaseMatch(scope);
    const rows = await Card.aggregate([
      { $match: cardMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const total = rows.reduce((s, r) => s + r.count, 0);

    return rows.map((r) => ({
      status: r._id,
      count: r.count,
      percentage:
        total > 0 ? parseFloat(((r.count / total) * 100).toFixed(2)) : 0,
    }));
  }

  /**
   * Section 4 – Age Group Distribution
   * Derived from the dob string field using MongoDB $dateFromString
   */
  async getAgeGroupDistribution(authUser) {
    const scope = this.getRequestScope(authUser);
    const cardMatch = this.getCardBaseMatch(scope);
    const now = new Date();

    const rows = await Card.aggregate([
      {
        $match: {
          ...cardMatch,
          dob: { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $addFields: {
          parsedDob: {
            $dateFromString: {
              dateString: "$dob",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      { $match: { parsedDob: { $ne: null } } },
      {
        $addFields: {
          ageYears: {
            $floor: {
              $divide: [
                { $subtract: [now, "$parsedDob"] },
                1000 * 60 * 60 * 24 * 365.25,
              ],
            },
          },
        },
      },
      {
        $addFields: {
          ageGroup: {
            $switch: {
              branches: [
                { case: { $lte: ["$ageYears", 18] }, then: "0-18" },
                { case: { $lte: ["$ageYears", 35] }, then: "19-35" },
                { case: { $lte: ["$ageYears", 50] }, then: "36-50" },
                { case: { $lte: ["$ageYears", 65] }, then: "51-65" },
              ],
              default: "65+",
            },
          },
        },
      },
      { $group: { _id: "$ageGroup", count: { $sum: 1 } } },
    ]);

    const total = rows.reduce((s, r) => s + r.count, 0);

    return AGE_GROUPS.map((group) => {
      const found = rows.find((r) => r._id === group);
      const count = found?.count ?? 0;
      return {
        ageGroup: group,
        count,
        percentage:
          total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0,
      };
    });
  }

  /**
   * Section 6 – Location-wise Distribution
   * Groups non-deleted cards by pincode, returns top 20
   */
  async getLocationDistribution(limitInput, authUser) {
    const scope = this.getRequestScope(authUser);
    const cardMatch = this.getCardBaseMatch(scope);
    const limit = limitInput ? parseInt(limitInput, 10) : 20;

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ApiError(400, "Invalid limit. Use 1-100");
    }

    const rows = await Card.aggregate([
      {
        $match: {
          ...cardMatch,
          pincode: { $exists: true, $nin: [null, ""] },
        },
      },
      { $group: { _id: "$pincode", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    const total = rows.reduce((s, r) => s + r.count, 0);

    return rows.map((r, idx) => ({
      rank: idx + 1,
      pincode: r._id,
      count: r.count,
      percentage:
        total > 0 ? parseFloat(((r.count / total) * 100).toFixed(2)) : 0,
    }));
  }

  /**
   * Section 7 – Employee Performance
   * Cards created per employee, joined with user name, top 20
   */
  async getEmployeePerformance(limitInput, authUser) {
    const scope = this.getRequestScope(authUser);
    const cardMatch = this.getCardBaseMatch(scope);
    const performanceMatch = {
      ...cardMatch,
      $and: [{ createdBy: { $ne: null } }, { createdBy: { $ne: "-1" } }],
    };
    const limit = limitInput ? parseInt(limitInput, 10) : 20;

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ApiError(400, "Invalid limit. Use 1-100");
    }

    const rows = await Card.aggregate([
      {
        $match: performanceMatch,
      },
      { $group: { _id: "$createdBy", cardsIssued: { $sum: 1 } } },
      { $sort: { cardsIssued: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
      },
    ]);

    const topCount = rows[0]?.cardsIssued ?? 1;
    const grandTotal = rows.reduce((s, r) => s + r.cardsIssued, 0);

    return rows.map((r, idx) => ({
      rank: idx + 1,
      employeeId: r._id,
      name: r.user?.name ?? "Unknown",
      cardsIssued: r.cardsIssued,
      percentageOfTop: parseFloat(
        ((r.cardsIssued / topCount) * 100).toFixed(2),
      ),
      percentageOfTotal:
        grandTotal > 0
          ? parseFloat(((r.cardsIssued / grandTotal) * 100).toFixed(2))
          : 0,
    }));
  }
}

export default new ReportService();
