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


export async function POST(req, res) {
  try {
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json(
        { error: "Invalid request data: items are required" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        if (item.type === "file") {
          const file = await client.files.get(item.id);

          const stream = await client.files.getReadStream(item.id);

          // Stream content to a buffer or collect chunks
          const chunks = [];
          await new Promise((resolve, reject) => {
            stream.on("data", (chunk) => {
              chunks.push(chunk);
            });

            stream.on("end", resolve);
            stream.on("error", reject);
          });

          // Combine chunks into a single buffer
          const fileBuffer = Buffer.concat(chunks);

          results.push({
            id: item.id,
            name: item.name,
            contentType:
              file.file_version.content_type || "application/octet-stream",
            content: fileBuffer.toString("base64"), // Encoding file content for transport
          });
        } else {
          throw new Error(`Unsupported item type: ${item.type}`);
        }
      } catch (error) {
        console.error(
          `Failed to download ${item.type} with ID ${item.id}:`,
          error
        );
        errors.push({ id: item.id, type: item.type, error: error.message });
      }
    }

    return NextResponse.json({
      message: "Bulk download operation completed",
      downloadItems: results,
      failedItems: errors,
    });
  } catch (error) {
    console.error("Error downloading files from Box:", error);
    return Response.json(
      { error: "Failed to download files" },
      { status: error.response?.statusCode || 500 }
    );
  }
}

