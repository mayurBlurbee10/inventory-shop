import { Request, Response } from "express";
import BoxSDK from "box-node-sdk";
import userService from "../services/user.service.ts";
import portalService from "../services/portal.service.ts";
import apiLogsService from "../services/apiLogs.service.ts";
import { reverseSanitizeName } from "../utils/commonUtils.ts";
import { asyncHandler } from "../utils/helper.ts";

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

// GET /api/box/events
const getEvents = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { portalId, startDate, endDate, userId } = req.query;

    const user = await userService.getUserById(userId as string);
    let userRole = "";

    if (userId && user) {
      const permission = Array.isArray((user as any).permissions)
        ? (user as any).permissions.find(
            (item: any) => item.portalId === portalId
          )
        : null;

      if (!permission) {
        const isSuperadmin = Array.isArray((user as any).permissions)
          ? (user as any).permissions.find((item: any) => item.portalId === null)
          : null;
        if (isSuperadmin) {
          userRole = isSuperadmin.role;
        }
      } else {
        userRole = permission.role;
      }
    }

    const portal = await portalService.getPortalByLegalName(
      reverseSanitizeName(portalId as string)
    );

    if (!portal) {
      return res.status(404).json({ error: "No report data found for this portal" });
    }

    const internalLogs = await apiLogsService.getApiLogsDateWise(
      portalId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      userRole === "user" ? (userId as string) : undefined
    );

    const boxUserId = (user as any)?.boxUserId;
    const newClient = sdk.getAppAuthClient("user", boxUserId);

    const events = await newClient.events.get({
      stream_type: "all",
      limit: 1000,
    });

    const filteredEvents = (events.entries || []).filter((event: any) =>
      ["ITEM_DOWNLOAD", "ITEM_PREVIEW"].includes(event.event_type)
    );

    return res.status(200).json({
      message: "report data retrieved successfully",
      data: internalLogs,
      boxEvents: filteredEvents || [],
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
