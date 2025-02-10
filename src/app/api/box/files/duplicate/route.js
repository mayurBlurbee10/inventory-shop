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

    const folderItems = await newClient.folders.getItems(boxFolderId, {
      fields: "id,name",
    });

    for (const file of files) {
      let fileName = file.name;
      let baseName = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
      let extension = fileName.split(".").pop();
      let counter = 1;

      console.log("FileName", file.name);

      fileName = `${baseName}(${counter}).${extension}`;
     
      const existingFile = folderItems.entries.find(
        (item) => item.name === fileName
      );

      if (existingFile) {
        counter++;
      }

      counter++;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileStream = new Readable();
      fileStream.push(buffer);
      fileStream.push(null);

      console.log("Uploading renamed file:", fileName);

      const uploadedFile = await newClient.files.uploadFile(
        boxFolderId,
        fileName,
        fileStream,
        { description: email }
      );

      uploadedFiles.push(uploadedFile.entries[0]);
    }

    return NextResponse.json({
      message: "Upload completed (duplicates renamed)",
      files: uploadedFiles,
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
