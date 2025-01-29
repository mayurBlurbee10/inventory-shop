import apiLogsService from "@/services/apiLogsService";
import portalService from "@/services/portalService";
import userService from "@/services/userService";
import { NextResponse } from "next/server";

function sanitizeName(name) {
  let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
  return sanitizeName.endsWith(".") ? sanitizeName.slice(0, -1) : sanitizeName;
}

const getLastNMonthsData = (data, monthsCount) => {
  const currentMonth = new Date().getMonth();
  const result = [];
  for (let i = 0; i < monthsCount; i++) {
    const monthIndex = (currentMonth - i + 12) % 12;
    result.push(data[monthIndex]);
  }
  return result.reverse();
};

const filterUsersByMonths = (users, year) => {
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

export async function GET(req) {
  try {
    const portalId = req.nextUrl.searchParams.get("portalId");
    const year = req.nextUrl.searchParams.get("year");

    const currentDate = new Date();
    const currentYear = new Date().getFullYear();
    const currentMonth = currentDate.getMonth();
    const filterYear = parseInt(year, 10) || currentYear;

    const portal = await portalService.getPortalById(portalId);
    const users = await userService.getUsersByPortal(
      sanitizeName(portal.legalName)
    );

    const res = await apiLogsService.getApiLogs(
      sanitizeName(portal.legalName),
      filterYear
    );

    const stats = Array(12)
      .fill(null)
      .map((_, i) => ({
        name: new Date(0, i).toLocaleString("en-US", { month: "short" }),
        apiCalls: 0,
        activeUsers: 0, // Hardcode active users to 0 for now
      }));

    res.forEach((log) => {
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
    return NextResponse.json(filteredData);
  } catch (error) {
    console.error("Error to get chart data:", error.message);
    return NextResponse.json(
      { error: "Failed to retrieve chart data.", details: error.message },
      { status: 500 }
    );
  }
}
