import { NextResponse } from "next/server";
import { logApiCall } from "@/app/lib/api-log-middleware";
import checkListService from "@/services/checkListService";

// Create or update the config file
export async function POST(req) {
  await logApiCall(req);

  const data = await req.json();
  let { name } = data;

  if (!name) {
    return NextResponse.json(
      { error: "Checklist name is required" },
      { status: 400 }
    );
  }

  try {
    const checklist = await checkListService.createCheckList(data);

    if (!checklist) {
      return NextResponse.json(
        { error: `Checklist didn't created. Please try again.` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      message: `checklist created successfully.`,
      data: checklist,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      { error: "Failed to create checklist.", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await logApiCall(req);
    const { searchParams } = new URL(req.url);
    const portalId = searchParams.get("portalId");

    if (!!portalId) {
      const checklists = await checkListService.getCheckListByPortalId(
        portalId
      );

      return NextResponse.json({
        message: `checklists retrieved successfully.`,
        data: checklists || [],
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve checklists.", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  await logApiCall(req);
  const { checklistId, ...rest } = await req.json();

  try {
    const checklist = await checkListService.updateCheckList(checklistId, rest);

    if (!checklist) {
      return NextResponse.json(
        { error: `Checklist didn't updated. Please try again.` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      message: `checklist updated successfully.`,
      data: checklist,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      { error: "Failed to update checklist.", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  await logApiCall(req);

  const { checklistId } = await req.json();
  try {
    await checkListService.deleteCheckList(checklistId);

    return NextResponse.json({
      message: `checklist deleted successfully.`,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      { error: "Failed to delete checklist.", details: error.message },
      { status: 500 }
    );
  }
}
