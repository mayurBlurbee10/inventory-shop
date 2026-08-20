import { Request, Response } from "express";
import apiLogsService from "../services/apiLogs.service.ts";
import portalService from "../services/portal.service.ts";
import userService from "../services/user.service.ts";
import {
  sanitizeName,
  reverseSanitizeName,
} from "../utils/commonUtils.ts";
import userPortalService from "../services/user.portal.service.ts";
import { asyncHandler } from "../utils/helper.ts";

const getLastNMonthsData = (data: any[], monthsCount: number) => {
  const currentMonth = new Date().getMonth();
  const result: any[] = [];
  for (let i = 0; i < monthsCount; i++) {
    const monthIndex = (currentMonth - i + 12) % 12;
    result.push(data[monthIndex]);
  }
  return result.reverse();
};

const filterUsersByMonths = (users: any[], year: number) => {
  const userCountByMonth = Array(12).fill(0);

  users.forEach((user) => {
    const createdDate = new Date(user.createdAt);
    if (createdDate.getFullYear() === year) {
      const monthIndex = createdDate.getMonth();
      userCountByMonth[monthIndex] += 1;
    }
  });

  return userCountByMonth;
};

const getChartData = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { portalId, year } = req.query;

    const currentDate = new Date();
    const currentYear = new Date().getFullYear();
    const currentMonth = currentDate.getMonth();
    const filterYear = parseInt(year as string, 10) || currentYear;

    const portal = await portalService.getPortalById(portalId as string);
    const portalSlug = portal?.legalName
      ? sanitizeName(portal.legalName)
      : (portalId as string);

    const users = await userService.getUsersByPortal(portalSlug);

    const apiLogs = await apiLogsService.getApiLogs(portalSlug, filterYear);

    const stats = Array(12)
      .fill(null)
      .map((_, i) => ({
        name: new Date(0, i).toLocaleString("en-US", { month: "short" }),
        apiCalls: 0,
        activeUsers: 0,
      }));

    apiLogs.forEach((log: any) => {
      const date = new Date(log.createdAt);
      const monthIndex = date.getMonth();
      stats[monthIndex].apiCalls += 1;
    });

    const userCountByMonth = filterUsersByMonths(users, filterYear);

    let cumulativeActiveUsers = 0;
    stats.forEach((monthStat, index) => {
      if (index > currentMonth && filterYear === currentYear) {
        monthStat.activeUsers = 0;
      } else {
        cumulativeActiveUsers += userCountByMonth[index];
        monthStat.activeUsers = cumulativeActiveUsers;
      }
    });

    const filteredData = getLastNMonthsData(stats, 12);
    return res.status(200).json(filteredData);
  } catch (error) {
    console.error("Error to get chart data:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to retrieve chart data.",
      details: (error as Error).message,
    });
  }
});

// Chart Report
const getReportData = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { portalId, startDate, endDate, userId } = req.query;

    if (!portalId) {
      return res.status(400).json({ error: "portalId is required" });
    }

    const user = userId
      ? await userService.getUserById(userId as string)
      : null;

    let userRole = null;
    if (user && portalId) {
      userRole = await userPortalService.getPortalRole(
        user.id as string,
        portalId as string,
      );
    }

    const { reverseSanitizeName } = await import("../utils/commonUtils.ts");
    const apiLogsService = (await import("../services/apiLogs.service.ts")).default;
    const portal = await portalService.getPortalByLegalName(
      reverseSanitizeName(portalId as string)
    );

    if (!portal) {
      return res.status(404).json({
        error: "No report data found for this portal",
      });
    }

    const resData = await apiLogsService.getApiLogsDateWise(
      portalId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      userRole === "user" ? (userId as string) : undefined
    );

    return res.status(200).json({
      message: "report data retrieved successfully",
      data: resData,
    });
  } catch (error) {
    console.error("Error to get report data:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to retrieve report data.",
      details: (error as Error).message,
    });
  }
});

export default {
  getChartData,
  getReportData,
};

