import { Request, Response } from "express";
import BoxSDK from "box-node-sdk";
import userService from "../services/user.service.ts";
import portalService from "../services/portal.service.ts";
import apiLogsService from "../services/apiLogs.service.ts";
import { reverseSanitizeName } from "../utils/commonUtils.ts";
import { asyncHandler } from "../utils/helper.ts";

// Initialise Box SDK
const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    passphrase: process.env.BOX_PASSPHRASE,
    enterpriseID: process.env.BOX_ENTERPRISE_ID,
  },
});

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
        ? (user as any).permissions.find((item: any) => item.portalId === portalId)
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
    const boxUserId = (user as any).boxUserId;
    const newClient = sdk.getAppAuthClient("user", boxUserId);
    // Get Box events for the given date range
    const events = await newClient.events.get({
      // stream_type: "admin_logs",
      stream_type: "all",
      // created_after: new Date(startDate).toISOString(),
      // created_before: new Date(endDate).toISOString(),
      limit: 1000, // optional, default is 100
    });

    const filteredEvents = events.entries.filter((event: any) =>
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
