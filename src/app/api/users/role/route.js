import { logApiCall } from "@/app/lib/api-log-middleware";
import { UserRole } from "@/config/constants";
import permissionService from "@/services/permissionService";
import userService from "@/services/userService";
import { NextResponse } from "next/server";
const sanitizeData = (data) => {
    const sanitized = {};
    for (const key in data) {
      if (
        data[key] !== undefined && // Remove undefined values
        typeof data[key] !== "function" // Remove functions
      ) {
        sanitized[key] =
          data[key] instanceof Date
            ? data[key].toISOString() // Convert dates to ISO strings
            : data[key];
      }
    }
    return sanitized;
  };

export async function PUT(request) {
  try {
    await logApiCall(request);

    const userData = await request.json();
    console.log("Received userData:", userData);

    const role = userData.role === "user" ? UserRole.USER : UserRole.ADMIN;

    const user = await userService.getUserById(userData.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const permission = user.permissions.find(
      (item) => item.portalId === userData.portalId
    );

    if (permission) {
      permission.role = role;
    } else {
      return NextResponse.json(
        { error: "Permission not found for the provided portalId" },
        { status: 404 }
      );
    }

    await permissionService.updatePermission(userData.id, { permissions: permission });

    return NextResponse.json("Permission updated");
  } catch (error) {
    console.error("Error in PUT /api/users:", error);
    return NextResponse.json(
      { error: "Failed to edit user", details: error.message },
      { status: 500 }
    );
  }
}
