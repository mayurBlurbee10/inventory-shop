import { NextResponse } from "next/server";
import { getBoxAppUserContent } from "@/lib/box"; // Updated import name
import BoxSDK from "box-node-sdk";
import { Readable } from "stream";
import { logApiCall } from "@/app/lib/api-log-middleware";
import { addCollaborator } from "../share/route";

const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    passphrase: process.env.BOX_PASSPHRASE,
    enterpriseID: process.env.BOX_ENTERPRISE_ID,
  },
});
const client = sdk.getAppAuthClient(
  "enterprise",
  process.env.BOX_ENTERPRISE_ID
);

export async function POST(req) {
  try {
    // here userId is BoxUserId
    await logApiCall(req);
    const { items, destinationFolderId, userId } = await req.json();
    if (!Array.isArray(items) || items.length === 0 || !destinationFolderId) {
      return NextResponse.json(
        {
          error:
            "Invalid request data: items and destinationFolderId are required.",
        },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];
    for (const item of items) {
      try {
        const movedFile = await client.files.copy(item.id, destinationFolderId);
        await addCollaborator(movedFile.id, userId, "editor", "file");
        results.push(movedFile);
      } catch (error) {
        console.error(`Failed to copy ${item.type} with ID ${item.id}:`, error);
        errors.push({ id: item.id, type: item.type, error: error.message });
      }
    }
    return NextResponse.json({
      message: "File uploaded successfully",
      files: results,
      failedItems: errors,
    });
  } catch (error) {
    console.error("Error file upload:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
