// src/app/api/box/create-user/route.js
import { NextResponse } from "next/server";
import { logApiCall } from "@/app/lib/api-log-middleware";
import { createBoxAppUser } from "@/app/lib/boxCreateAppUser";

export async function POST(request) {
  try {
    await logApiCall(request, () => {});
    const data = await request.json();
    const { userName = "Test User", externalId = Date.now().toString() } = data;

    const user = await createBoxAppUser({ userName, externalId });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error creating Box app user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Box user" },
      { status: 500 }
    );
  }
}
