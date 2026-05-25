import userService from "@/services/userService";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const fileUrl = request.nextUrl.searchParams.get("url");
    const fileType = request.nextUrl.searchParams.get("fileType");
    const token = request.nextUrl.searchParams.get("token");

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File URL is required." },
        { status: 400 }
      );
    }
    const response = await fetch(fileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "*/*",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch file." },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type");

    const buffer = await response.arrayBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="file.${fileType}"`,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching file:", error);
    return NextResponse.json(
      { error: "Failed to fetch file.", details: error.message },
      { status: 500 }
    );
  }
}
