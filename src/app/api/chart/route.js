import apiLogsService from "@/services/apiLogsService";
import portalService from "@/services/portalService";
import { NextResponse } from "next/server";

function sanitizeName(name) {
  let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
  return sanitizeName.endsWith(".") ? sanitizeName.slice(0, -1) : sanitizeName;
}

export async function GET(req) {
  try {
    const portalId = req.nextUrl.searchParams.get("portalId");
    const year = req.nextUrl.searchParams.get("year");

    const currentYear = new Date().getFullYear();
    const filterYear = parseInt(year, 10) || currentYear;

    const portal = await portalService.getPortalById(portalId);

    const res = await apiLogsService.getApiLogs(sanitizeName(portal.legalName), filterYear);

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
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error to get chart data:", error.message);
    return NextResponse.json(
      { error: "Failed to retrieve chart data.", details: error.message },
      { status: 500 }
    );
  }
}
