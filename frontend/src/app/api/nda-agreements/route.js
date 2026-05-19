import { logApiCall } from "@/app/lib/api-log-middleware";
import ndaAgreementService from "@/services/ndaAgreementService";
import { NextResponse } from "next/server";

const isEmptyHtml = (html) =>
  !html ||
  html.trim() === "" ||
  html.trim() === "<p></p>" ||
  html.trim() === "<p><br></p>";

export async function GET(req) {
  await logApiCall(req);
  const { searchParams } = new URL(req.url);
  const portalId = searchParams.get("portalId");
  const hasPageParam = searchParams.has("page");
  const hasLimitParam = searchParams.has("limit");
  const usePagination = hasPageParam || hasLimitParam;

  if (!portalId) {
    return NextResponse.json(
      { error: "portalId is required" },
      { status: 400 },
    );
  }

  try {
    if (!usePagination) {
      const data = await ndaAgreementService.listByPortalId(portalId);
      return NextResponse.json({
        message: "NDA agreements fetched successfully.",
        data,
      });
    }

    const pageParam = Number(searchParams.get("page") || 1);
    const limitParam = Number(searchParams.get("limit") || 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 10;

    const result = await ndaAgreementService.listByPortalIdPaginated(
      portalId,
      page,
      limit,
    );
    return NextResponse.json({
      message: "NDA agreements fetched successfully.",
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching NDA agreements:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch NDA agreements.", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  await logApiCall(req);
  const body = await req.json();
  const { portalId, title, ndaType, description, fileId, originalFileName } =
    body;

  if (!portalId || !title || !ndaType) {
    return NextResponse.json(
      { error: "portalId, title, and ndaType are required" },
      { status: 400 },
    );
  }

  if (ndaType !== "editor" && ndaType !== "esign") {
    return NextResponse.json(
      { error: 'ndaType must be "editor" or "esign"' },
      { status: 400 },
    );
  }

  if (ndaType === "editor" && isEmptyHtml(description)) {
    return NextResponse.json(
      { error: "description is required for NDA editor type" },
      { status: 400 },
    );
  }

  if (ndaType === "esign" && !fileId) {
    return NextResponse.json(
      { error: "fileId is required for e-sign type" },
      { status: 400 },
    );
  }

  try {
    const row = await ndaAgreementService.createAgreement({
      portalId,
      title,
      ndaType,
      description: ndaType === "editor" ? description : null,
      fileId: ndaType === "esign" ? fileId : null,
      originalFileName:
        ndaType === "esign" ? originalFileName || null : null,
      isDefault: false,
    });
    return NextResponse.json({
      message: "NDA agreement created successfully.",
      data: row,
    });
  } catch (error) {
    console.error("Error creating NDA agreement:", error.message);
    return NextResponse.json(
      { error: "Failed to create NDA agreement.", details: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  await logApiCall(req);
  const body = await req.json();
  const { id, title, ndaType, description, fileId, originalFileName } = body;

  if (!id || !title || !ndaType) {
    return NextResponse.json(
      { error: "id, title, and ndaType are required" },
      { status: 400 },
    );
  }

  if (ndaType === "editor" && isEmptyHtml(description)) {
    return NextResponse.json(
      { error: "description is required for NDA editor type" },
      { status: 400 },
    );
  }

  if (ndaType === "esign" && !fileId) {
    return NextResponse.json(
      { error: "fileId is required for e-sign type" },
      { status: 400 },
    );
  }

  try {
    const existing = await ndaAgreementService.getById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "NDA agreement not found" },
        { status: 404 },
      );
    }

    const updated = await ndaAgreementService.updateAgreement(id, {
      title,
      ndaType,
      description: ndaType === "editor" ? description : null,
      fileId: ndaType === "esign" ? fileId : null,
      originalFileName:
        ndaType === "esign" ? originalFileName || null : null,
    });

    return NextResponse.json({
      message: "NDA agreement updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating NDA agreement:", error.message);
    return NextResponse.json(
      { error: "Failed to update NDA agreement.", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
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
    await ndaAgreementService.deleteAgreement(id);
    return NextResponse.json({ message: "NDA agreement deleted successfully." });
  } catch (error) {
    console.error("Error deleting NDA agreement:", error.message);
    return NextResponse.json(
      { error: "Failed to delete NDA agreement.", details: error.message },
      { status: 500 },
    );
  }
}
