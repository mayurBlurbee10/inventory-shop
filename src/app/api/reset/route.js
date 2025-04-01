import { NextResponse } from "next/server";
import { logApiCall } from "@/app/lib/api-log-middleware";
import resetService from "@/services/resetService";

export async function POST(req) {
  await logApiCall(req);

  const { portalId } = await req.json();

  if (!portalId) {
    return NextResponse.json(
      { error: "portalid is required" },
      { status: 400 }
    );
  }

  try {
    await resetService.resetPortal(portalId);

    return NextResponse.json({
      message: `Portal data reset successfully.`,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      { error: "Failed to reset portal.", details: error.message },
      { status: 500 }
    );
  }
}