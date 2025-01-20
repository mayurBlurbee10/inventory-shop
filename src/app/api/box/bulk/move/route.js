import { logApiCall } from "@/app/lib/api-log-middleware";
import BoxSDK from "box-node-sdk";
import { NextResponse } from "next/server";

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
    const { items, destinationFolderId } = await req.json();
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
        if (item.type === "file") {
          const movedFile = await client.files.move(
            item.id,
            destinationFolderId
          );
          results.push({
            id: item.id,
            type: "file",
            status: "moved",
            movedFile,
          });
        } else if (item.type === "folder") {
          const movedFolder = await client.folders.move(
            item.id,
            destinationFolderId
          );
          results.push({
            id: item.id,
            type: "folder",
            status: "moved",
            movedFolder,
          });
        } else {
          throw new Error(`Unsupported item type: ${item.type}`);
        }
      } catch (error) {
        console.error(`Failed to move ${item.type} with ID ${item.id}:`, error);
        errors.push({ id: item.id, type: item.type, error: error.message });
      }
    }
    return NextResponse.json({
      message: "Bulk move operation completed",
      movedItems: results,
      failedItems: errors,
    });
  } catch (error) {
    console.error("Error bulk moving files or folders:", error);
    return NextResponse.json(
      {
        error: "Failed to move files or folders.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
