import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const fileUrl = request.nextUrl.searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json({ error: "File URL is required." }, { status: 400 });
    }

    // Fetch file as a stream
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch file." }, { status: response.status });
    }

    const contentType = response.headers.get("content-type");
    const buffer = await response.arrayBuffer(); // Convert to ArrayBuffer

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Error fetching file:", error);
    return NextResponse.json({ error: "Failed to fetch file.", details: error.message }, { status: 500 });
  }
}
