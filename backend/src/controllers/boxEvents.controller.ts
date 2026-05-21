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

export default {
  getEvents,
};
