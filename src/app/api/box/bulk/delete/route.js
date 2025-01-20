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

const client = sdk.getAppAuthClient("enterprise", process.env.BOX_ENTERPRISE_ID);

export async function POST(request) {
  try {
    await logApiCall(request);
    const { items } = await request.json();

    const accessToken = await client._session.getAccessToken();
    const newClient = sdk.getBasicClient(accessToken);

    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        if (item.type === "file") {
          await newClient.files.delete(item.id);
        } else if (item.type === "folder") {
          await newClient.folders.delete(item.id);
        } else {
          throw new Error(`Unknown item type: ${item.type}`);
        }
        results.push({ id: item.id, type: item.type, status: "deleted" });
      } catch (err) {
        console.error(`Failed to delete ${item.type} with ID ${item.id}:`, err);
        errors.push({ id: item.id, type: item.type, error: err.message });
      }
    }

    return NextResponse.json({
      message: "Bulk delete operation completed",
      deletedItems: results,
      failedItems: errors,
    });
  } catch (error) {
    console.error("Error bulk deleting files or folders:", error);
    return NextResponse.json(
      {
        error: "Failed to delete files or folders.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
