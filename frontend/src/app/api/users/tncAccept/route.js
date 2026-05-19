import { logApiCall } from "@/app/lib/api-log-middleware";
import userService from "@/services/userService";
import { NextResponse } from "next/server";

export async function PUT(request) {
  try {
    await logApiCall(request);
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    await userService.updateUser(userId, { isTNCAccepted: true });
    return NextResponse.json("Terms and conditions accepted successfully");
  } catch (error) {
    console.error("Error in PUT /api/users/tncAccept:", error);
    return NextResponse.json(
      { error: "Failed to edit user", details: error.message },
      { status: 500 }
    );
  }
}
