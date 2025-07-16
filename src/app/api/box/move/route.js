import { logApiCall } from "@/app/lib/api-log-middleware";
import { NextResponse } from "next/server";
import BoxSDK from "box-node-sdk";

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

export async function POST(request) {
  try {
    const { itemId, destinationFolderId, type } = await request.json();
    const apiType = type === "file" ? "move-file" : "move-folder";
    await logApiCall(request, () => {}, apiType); // Log the API call

    // Validate input parameters
    if (!itemId || !destinationFolderId || !type) {
      return NextResponse.json(
        { error: "Missing required parameters: itemId, destinationFolderId, and type are mandatory." },
        { status: 400 }
      );
    }

    if (type !== "file" && type !== "folder") {
      return NextResponse.json(
        { error: "Invalid type. Accepted values are 'file' or 'folder'." },
        { status: 400 }
      );
    }

    let response;

    if (type === "file") {
      // Move file
      response = await client.files.move(itemId, destinationFolderId);
    } else {
      // Move folder
      response = await client.folders.move(itemId, destinationFolderId);
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error moving file or folder:", error);
    return NextResponse.json(
      {
        error: `Failed to move ${type === "file" ? "file" : "folder"}.`,
        details: error.message,
      },
      { status: 500 }
    );
  }
}
