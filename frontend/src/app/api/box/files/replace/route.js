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
    const userId = formData.get("userId") || "";

    const uploadedFiles = [];

    const folderItems = await newClient.folders.getItems(boxFolderId, { fields: "id,name" });

    for (const file of files) {
      let existingFiles = await newClient.search.query(file.name, {
        ancestor_folder_ids: boxFolderId,
        type: "file",
      });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileStream = new Readable();
      fileStream.push(buffer);
      fileStream.push(null);

      const existingFile = folderItems.entries.find((item) => item.name === file.name);
      if (existingFile) {
        // File already exists, replace it
        const existingFileId = existingFile.id;
        console.log(`Replacing existing file: ${file.name}`);

        const updatedFile = await newClient.files.uploadNewFileVersion(
          existingFileId,
          fileStream
        );
        uploadedFiles.push(updatedFile.entries[0]);
      } else {
        // File does not exist, upload as a new file
        console.log(`Uploading new file: ${file.name}`);

        const uploadedFileRes = await newClient.files.uploadFile(
          boxFolderId,
          file.name,
          fileStream,
          { description: email }
        );

        const uploadedFile = uploadedFileRes.entries[0]

        await addCollaborator(uploadedFile.id, userId, "editor", "file");

        uploadedFiles.push(uploadedFile);
      }
    }

    return NextResponse.json({
      message: "Files replaced successfully",
      files: uploadedFiles,
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
