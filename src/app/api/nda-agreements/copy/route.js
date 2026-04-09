import { logApiCall } from "@/app/lib/api-log-middleware";
import ndaAgreementService from "@/services/ndaAgreementService";
import { NextResponse } from "next/server";

export async function POST(req) {
  await logApiCall(req);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const copied = await ndaAgreementService.copyAgreement(id);
    return NextResponse.json({
      message: "NDA copied successfully.",
      data: copied,
    });
  } catch (error) {
    console.error("Error copying NDA agreement:", error.message);
    return NextResponse.json(
      { error: "Failed to copy NDA agreement.", details: error.message },
      { status: 500 },
    );
  }
}

