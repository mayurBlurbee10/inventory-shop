import { NextResponse } from "next/server";
import { logApiCall } from "@/app/lib/api-log-middleware";
import messageService from "@/services/messageService";

// Create or update the config file
export async function POST(req) {
  await logApiCall(req);

  const data = await req.json();
  let { text } = data;

  if (!text) {
    return NextResponse.json(
      { error: "Message text is required" },
      { status: 400 }
    );
  }

  try {
    const message = await messageService.createMessage(data);

    if (!message) {
      return NextResponse.json(
        { error: `Message didn't send. Please try again.` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      message: `message created successfully.`,
      data: message,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return NextResponse.json(
      { error: "Failed to create message.", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await logApiCall(req);

    const { searchParams } = new URL(req.url);
    const portalId = searchParams.get("portalId");
    const senderId = searchParams.get("senderId");
    const receiverId = searchParams.get("receiverId");

    if (!!portalId && !!senderId && !!receiverId) {
      const messages = await messageService.getMessages(
        senderId,
        receiverId,
        portalId
      );

      return NextResponse.json({
        message: `messages retrieved successfully.`,
        data: messages || [],
      });
    }
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    return NextResponse.json(
      { error: "Failed to retrieve messages.", details: error.message },
      { status: 500 }
    );
  }
}
