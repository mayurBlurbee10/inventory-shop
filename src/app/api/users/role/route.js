import { logApiCall } from "@/app/lib/api-log-middleware";
import { UserRole } from "@/config/constants";
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

    // Sanitize the input data
    const sanitizedData = sanitizeData({
      role: userData.role === "user" ? UserRole.USER : UserRole.ADMIN,
    });

    console.log("Sanitized data:", sanitizedData);

    // Update the user
    await userService.updateUser(userData.id, sanitizedData);
    return NextResponse.json("user Updated");
  } catch (error) {
    console.error("Error in PUT /api/users:", error);
    return NextResponse.json(
      { error: "Failed to edit user", details: error.message },
      { status: 500 }
    );
  }
}
