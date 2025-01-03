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

export async function GET(request) {
  try {
    await logApiCall(request);
    const fileId = request.nextUrl.searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required." },
        { status: 400 }
      );
    }

    const fileDetails = await client.files.get(fileId);
    
    if (!fileDetails) {
      return NextResponse.json(
        { error: "File not found." },
        { status: 404 }
      );
    }

    const isShareable = fileDetails.shared_link !== null;

    if (!isShareable) {
      return NextResponse.json(
        { error: "This file is not shareable." },
        { status: 403 }
      );
    }

    const fileStream  = await client.files.getReadStream(fileId);

    if (!fileStream ) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const stream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      const mimeType = {
        pdf: 'application/pdf',
        png: 'image/png',
        jpg: 'image/jpeg',
        mp4: 'video/mp4',
        mp3: 'audio/mp3',
        svg: 'image/svg+xml',
      };
      
      const extension = fileDetails.name.split('.')[1]; 
  

      const headers = new Headers({
        "Content-Type": mimeType[extension] || "application/octet-stream",
        "Content-Disposition": `inline; filename="${fileDetails.name}"`,
      });
  
      return new NextResponse(stream, { headers });
  } catch (error) {
    console.error("Error updating shared link:", error);
    return NextResponse.json(
      {
        error: "Failed to update shared link.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
