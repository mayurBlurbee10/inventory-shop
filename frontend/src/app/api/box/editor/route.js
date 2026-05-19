import { logApiCall } from "@/app/lib/api-log-middleware";
import { NextResponse } from "next/server";
import BoxSDK from "box-node-sdk";
import path from "path";

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

// export async function GET(request) {
//   try {
//     await logApiCall(request);
//     const fileId = request.nextUrl.searchParams.get("fileId");

//     if (!fileId) {
//       return NextResponse.json(
//         { error: "File ID is required." },
//         { status: 400 }
//       );
//     }

//     const fileDetails = await client.files.get(fileId);

//     if (!fileDetails) {
//       return NextResponse.json({ error: "File not found." }, { status: 404 });
//     }

//     // const fileUrl = client.files.getDownloadURL(fileId);
//     const fileStream = await client.files.getReadStream(fileId);

//     if (!fileStream) {
//       return NextResponse.json({ error: "File not found." }, { status: 404 });
//     }

//     const stream = new ReadableStream({
//       start(controller) {
//         fileStream.on("data", (chunk) => controller.enqueue(chunk));
//         fileStream.on("end", () => controller.close());
//         fileStream.on("error", (err) => controller.error(err));
//       },
//     });

//     const mimeType = {
//       pdf: "application/pdf",
//       png: "image/png",
//       jpg: "image/jpeg",
//       mp4: "video/mp4",
//       mp3: "audio/mp3",
//       svg: "image/svg+xml",
//       docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       doc: "application/msword"
//     };

//     const extension = fileDetails.name.split(".")[1];

//     const headers = new Headers({
//       "Content-Type": mimeType[extension] || "application/octet-stream",
//       "Content-Disposition": `inline; filename="${fileDetails.name}"`,
//     });

//     return new NextResponse(stream, { headers });
//   } catch (error) {
//     console.error("Error updating shared link:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to update shared link.",
//         details: error.message,
//       },
//       { status: 500 }
//     );
//   }
// }

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

    // Get a publicly accessible shared link
    const fileInfo = await client.files.update(fileId, {
      shared_link: {
        access: "open", // Public access
        permissions: { can_download: true },
      },
    });

    if (!fileInfo.shared_link?.download_url) {
      return NextResponse.json(
        { error: "Could not generate download link." },
        { status: 500 }
      );
    }

    const fileType = path.extname(fileInfo.name).replace(".", "");

    return NextResponse.json({
      fileUrl: fileInfo.shared_link.download_url,
      fileType,
    });
  } catch (error) {
    console.error("Error generating shared link:", error);
    return NextResponse.json(
      { error: "Failed to generate file link.", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    // here userId is BoxUserId
    await logApiCall(req, () => {});
    const body = await req.json();

    if (body.status !== 2 || !body.url) {
      return NextResponse.json(
        { message: "No document saved yet" },
        { status: 200 }
      );
    }

    const fileId = body.customization?.fileId; // 🔥 Extract the fileId
    if (!fileId) {
      throw new Error("File ID is missing in callback request");
    }

    const response = await fetch(body.url);
    const fileBuffer = await response.buffer();

    const accessToken = await client._session.getAccessToken();
    const newClient = sdk.getBasicClient(accessToken);

    const updatedFile = await newClient.files.uploadNewFileVersion(
      fileId,
      fileBuffer
    );

    return NextResponse.json({
      message: "Files replaced successfully",
      files: updatedFile,
    });
  } catch (error) {
    console.error("Error replacing files:", error);
    return NextResponse.json(
      {
        error: error.response?.body.message,
        status: error.response?.statusCode || 500,
      },
      { status: error.response?.statusCode || 500 }
    );
  }
}
