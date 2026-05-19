import { logApiCall } from "@/app/lib/api-log-middleware";
import ndaAgreementService from "@/services/ndaAgreementService";
import { NextResponse } from "next/server";

export async function PUT(req) {
  await logApiCall(req);
  const body = await req.json();
  const { agreementId, portalId } = body;

  if (!agreementId || !portalId) {
    return NextResponse.json(
      { error: "agreementId and portalId are required" },
      { status: 400 },
    );
  }

  try {
    const updated = await ndaAgreementService.setDefaultAgreement(
      agreementId,
      portalId,
    );
    return NextResponse.json({
      message: "Default NDA agreement updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error setting default NDA agreement:", error.message);
    return NextResponse.json(
      { error: "Failed to set default NDA agreement.", details: error.message },
      { status: 500 },
    );
  }
}