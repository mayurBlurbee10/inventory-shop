
import { NextResponse } from "next/server";
import BoxSDK from "box-node-sdk";
import userService from "@/services/userService";
import portalService from "@/services/portalService";
import apiLogsService from "@/services/apiLogsService";

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
const client = sdk.getAppAuthClient(
  "enterprise",
  process.env.BOX_ENTERPRISE_ID
);

function reverseSanitizeName(sanitizedName) {
  let reversedName = sanitizedName.endsWith("-")
    ? sanitizedName.slice(0, -1)
    : sanitizedName;

  reversedName = reversedName.replace(/-/g, " ");

  reversedName = reversedName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return reversedName;
}

export async function GET(req) {
  try {
    const portalId = req.nextUrl.searchParams.get("portalId");
    const startDate = req.nextUrl.searchParams.get("startDate");
    const endDate = req.nextUrl.searchParams.get("endDate");
    const userId = req.nextUrl.searchParams.get("userId");

    const user = await userService.getUserById(userId);
    let userRole = "";

    if (userId) {
      const permission = user.permissions.find(
        (permission) => permission.portalId === portalId
      );
      if (!permission) {
        const isSuperadmin = user.permissions.find(
          (permission) => permission.portalId === null
        );
        if (isSuperadmin) {
          userRole = isSuperadmin.role;
        }
      } else {
        userRole = permission.role;
      }
    }

    const portal = await portalService.getPortalByLegalName(
      reverseSanitizeName(portalId)
    );

    if (!portal) {
      return NextResponse.json(
        { error: "No report data found for this portal" },
        { status: 404 }
      );
    }

    // ✅ Get API logs from your system
    const internalLogs = await apiLogsService.getApiLogsDateWise(
      portalId,
      startDate,
      endDate,
      userRole === "user" ? userId : null
    );
    const boxUserId = user.boxUserId; // Ensure your DB or `user` object stores the Box user ID
    const newClient = sdk.getAppAuthClient("user", boxUserId);
    // ✅ Get Box events for the given date range
    const events = await newClient.events.get({
      // stream_type: "admin_logs",
      stream_type: "all",
      // created_after: new Date(startDate).toISOString(),
      // created_before: new Date(endDate).toISOString(),
      limit: 1000, // optional, default is 100
    });

    const filteredEvents = events.entries.filter((event) =>
      ["ITEM_DOWNLOAD", "ITEM_PREVIEW"].includes(event.event_type)
    );

    return NextResponse.json({
      message: "report data retrieved successfully",
      data: internalLogs,
      boxEvents: filteredEvents || [],
    });
  } catch (error) {
    console.error("Error to get report data:", error.message);
    return NextResponse.json(
      { error: "Failed to retrieve report data.", details: error.message },
      { status: 500 }
    );
  }
}