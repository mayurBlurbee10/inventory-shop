import { Request, Response } from "express";
import userService from "../services/user.service.ts";
import portalService from "../services/portal.service.ts";
import apiLogsService from "../services/apiLogs.service.ts";
import { reverseSanitizeName } from "../utils/commonUtils.ts";
import { asyncHandler } from "../utils/helper.ts";
import { getBoxClient } from "../utils/boxClient.ts";

const client = getBoxClient();

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      portalId,
      startDate,
      endDate,
      userId,
      limit: limitParam = "10",
      page: pageParam = "1",
      search = "",
      sortBy = "createdAt",
      sortOrder = "DESC",
      filter = "all",
    } = req.query as any;

    // Default pagination values
    const limit = parseInt(limitParam as string, 10);
    const page = parseInt(pageParam as string, 10);
    const offset = (page - 1) * limit;

    const user = await userService.getUserById(userId as string);
    let userRole = "";

    if (userId && user) {
      const permission = Array.isArray((user as any).permissions)
        ? (user as any).permissions.find(
          (item: any) => item.portalId === portalId
        )
        : null;
      if (!permission) {
        const superAdmin = Array.isArray((user as any).permissions)
          ? (user as any).permissions.find((item: any) => item.portalId === null)
          : null;
        if (superAdmin) userRole = superAdmin.role;
      } else {
        userRole = permission.role;
      }
    }
    let scopedUserId = null;
    if (filter === "my" || userRole === "user") {
      scopedUserId = userId as string;
    }

    const totalCount = await apiLogsService.getApiLogsCount(
      portalId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      scopedUserId,
      search
    );

    // Get API logs from your system
    const internalLogs = await apiLogsService.getApiLogsDateWise(
      portalId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      scopedUserId,
      limit,
      offset,
      search,
      sortBy,
      sortOrder
    );

    const boxUserId = (user as any)?.boxUserId;
    const newClient = client;

    const events = await newClient.events.getEvents({
      streamType: "all",
      limit: 1000,
    });

    const filteredEvents = events?.entries?.filter((event: any) =>
      ["ITEM_DOWNLOAD", "ITEM_PREVIEW"].includes(event.event_type)
    );

    return res.status(200).json({
      message: "report data retrieved successfully",
      data: internalLogs,
      boxEvents: filteredEvents || [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        limit: limit,
      },
    });
  } catch (error) {
    console.error("Error to get report data:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to retrieve report data.",
      details: (error as Error).message,
    });
  }
});

export const exportEvents = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      portalId,
      startDate,
      endDate,
      userId,
      search = "",
      sortBy = "createdAt",
      sortOrder = "DESC",
      filter = "all",
    } = req.query as any;

    const user = await userService.getUserById(userId as string);
    let userRole = "";

    if (userId && user) {
      const permission = Array.isArray((user as any).permissions)
        ? (user as any).permissions.find(
            (item: any) => item.portalId === portalId
          )
        : null;
      if (!permission) {
        const superAdmin = Array.isArray((user as any).permissions)
          ? (user as any).permissions.find(
              (item: any) => item.portalId === null
            )
          : null;
        if (superAdmin) userRole = superAdmin.role;
      } else {
        userRole = permission.role;
      }
    }

    let scopedUserId: string | null = null;
    if (filter === "my" || userRole === "user") {
      scopedUserId = userId as string;
    }

    const logs = await apiLogsService.getApiLogsForExport(
      portalId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      scopedUserId,
      search as string,
      sortBy as string,
      sortOrder as string
    );

    const formatTimestamp = (timestamp: string) =>
      new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

    const formatType = (type: string) =>
      type
        ? type
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        : "N/A";

    const escape = (val: any) => {
      const str = val == null ? "" : String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const headers = ["Date & Time", "Name", "User"];
    const rows = logs.map((log: any) => [
      escape(formatTimestamp(log.createdAt)),
      escape(formatType(log.type)),
      escape(
        log.createdBy
          ? `${log.createdBy.firstName || ""} ${log.createdBy.lastName || ""}`.trim() || "N/A"
          : "N/A"
      ),
    ]);

    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join(
      "\r\n"
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="api_logs_export.csv"'
    );
    return res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting api logs:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to export logs.",
      details: (error as Error).message,
    });
  }
});

export default {
  getEvents,
  exportEvents,
};
