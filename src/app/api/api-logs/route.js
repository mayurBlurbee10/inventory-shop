import { logApiCall } from "@/app/lib/api-log-middleware";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await logApiCall(request);
    return NextResponse.json({ message: "API log created" }, { status: 201 });
  } catch (error) {
    console.error("Failed to log API call:", error);
    return NextResponse.json(
      { error: "Failed to log API call" },
      { status: 500 }
    );
  }
}
