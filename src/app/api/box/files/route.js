// src/app/api/box/files/route.js
import { NextResponse } from "next/server";
import { getBoxAppUserContent } from "@/lib/box"; // Updated import name
import BoxSDK from "box-node-sdk";
import { Readable } from "stream";
import { logApiCall } from "@/app/lib/api-log-middleware";

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
    await logApiCall(request, () => {});
    // Get the service account token
    const accessToken = await client._session.getAccessToken();

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || "0";

    const data = await getBoxAppUserContent(accessToken, folderId); // Updated function call
    return NextResponse.json(data.entries);
  } catch (error) {
    console.error("Files error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes("token") ? 401 : 500 }
    );
  }
}

// export async function POST(req) {
//   try {
//     await logApiCall(req, () => {});
//     const accessToken = await client._session.getAccessToken();
//     const newClient = sdk.getBasicClient(accessToken);
//     // Process the multipart request
//     const formData = await req.formData();
//     const files = formData.getAll("file");

//     if (!files || files.length === 0) {
//       return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
//     }

//     const boxFolderId = formData.get("boxFolderId") || "0";
//     const email = formData.get("email") || "";

//     // Process files
//     const uploadedFiles = [];

//     for (const file of files) {
//       const bytes = await file.arrayBuffer();
//       const buffer = Buffer.from(bytes);

//       const fileStream = new Readable();
//       fileStream.push(buffer);
//       fileStream.push(null);

//       console.log("File name", file.name)

//       const uploadedFile = await newClient.files.uploadFile(
//         boxFolderId,
//         file.name,
//         fileStream,
//         { description: email }
//       );

//       uploadedFiles.push(uploadedFile.entries[0]);
//     }

//     return NextResponse.json({
//       message: "Files uploaded successfully",
//       files: uploadedFiles,
//     });
//   } catch (error) {
//     console.error("Error uploading files:", error);
//     return NextResponse.json(
//       { error: error.response?.body.message, status: error.response?.statusCode || 500 },
//       { status: error.response?.statusCode || 500 }
//     );
//   }
// }

export async function POST(req) {
  try {
    await logApiCall(req, () => {});
    const accessToken = await client._session.getAccessToken();
    const newClient = sdk.getBasicClient(accessToken);

    const formData = await req.formData();
    const files = formData.getAll("file");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const boxFolderId = formData.get("boxFolderId") || "0";
    const email = formData.get("email") || "";

    const uploadedFiles = [];
    const duplicateFiles = [];

    const folderItems = await newClient.folders.getItems(boxFolderId, { fields: "id,name" });

    for (const file of files) {
      const existingFile = folderItems.entries.find((item) => item.name === file.name);

      if (existingFile) {
        console.log(`File "${file}" already exists, skipping upload.`);
        const arrayBuffer = await file.arrayBuffer();
        const base64File = Buffer.from(arrayBuffer).toString("base64");

        duplicateFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          base64: base64File, // This allows the frontend to reconstruct the file
        });
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileStream = new Readable();
      fileStream.push(buffer);
      fileStream.push(null);

      console.log("Uploading unique file:", file.name);

      const uploadedFile = await newClient.files.uploadFile(
        boxFolderId,
        file.name,
        fileStream,
        { description: email }
      );

      uploadedFiles.push(uploadedFile.entries[0]);
    }

    return NextResponse.json({
      message: "Upload completed (existing files skipped)",
      files: uploadedFiles,
      duplicateFiles: duplicateFiles,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      {
        error: error.response?.body.message,
        status: error.response?.statusCode || 500,
      },
      { status: error.response?.statusCode || 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await logApiCall(req, () => {});
    const accessToken = await client._session.getAccessToken();
    const newClient = sdk.getBasicClient(accessToken);
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "No fileId provided" },
        { status: 400 }
      );
    }

    await newClient.files.delete(fileId);

    return NextResponse.json({
      message: "File deleted successfully",
      fileId: fileId,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: error.response?.body.message, details: error.message },
      { status: error.response?.statusCode || 500 }
    );
  }
}
