// src/app/api/box/files/route.js
import { NextResponse } from "next/server";
import { getBoxAppUserContent } from "@/lib/box"; // Updated import name
import BoxSDK from "box-node-sdk";
import { Readable } from "stream";
import stream from "stream";
import { logApiCall } from "@/app/lib/api-log-middleware";
import { addCollaborator } from "./share/route";
import fs from "fs";
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

export const getLocalFilesFromPublic = () => {
  const folderPath = path.join(process.cwd(), "public/files");
  return fs.readdirSync(folderPath).map((fileName) => ({
    name: fileName,
    path: path.join(folderPath, fileName),
  }));
};

export const uploadSampleFiles = async (email, userId, parentFolderId) => {
  const accessToken = await client._session.getAccessToken();
  const newClient = sdk.getBasicClient(accessToken);

  const demoPath = path.join(process.cwd(), 'public', 'demo');
  const foldersInDemo = fs.readdirSync(demoPath).filter((folder) =>
    fs.statSync(path.join(demoPath, folder)).isDirectory()
  );

  const uploadedFolders = [];

  for (const folderName of foldersInDemo) {
    const localFolderPath = path.join(demoPath, folderName);

    // Create folder in Box
    const createdFolder = await newClient.folders.create(parentFolderId, folderName);
    const createdFolderId = createdFolder.id;

    uploadedFolders.push({ name: folderName, id: createdFolderId });

    // Read files if the folder has files
    const files = fs
      .readdirSync(localFolderPath)
      .filter((file) => fs.statSync(path.join(localFolderPath, file)).isFile());

    for (const fileName of files) {
      const filePath = path.join(localFolderPath, fileName);
      const buffer = fs.readFileSync(filePath);

      const fileStream = new Readable();
      fileStream.push(buffer);
      fileStream.push(null);

      const uploadedFileRes = await newClient.files.uploadFile(
        createdFolderId,
        fileName,
        fileStream,
        { description: email }
      );

      const uploadedFile = uploadedFileRes.entries[0];

      // Add collaborator if not already added
      const collaborations = await newClient.files.getCollaborations(uploadedFile.id);
      const isAlreadyCollaborator = collaborations.entries.some(
        (collab) => collab.accessible_by && collab.accessible_by.id === userId
      );

      if (!isAlreadyCollaborator) {
        await addCollaborator(uploadedFile.id, userId, 'editor', 'file');
      }
    }
  }
  const folders = ["Demo", "Loan", "Statements"]
  for(const folder of folders){
    const createdFolder = await newClient.folders.create(parentFolderId, folder);
    const createdFolderId = createdFolder.id;

    uploadedFolders.push({ name: folder, id: createdFolderId });
  }

  return uploadedFolders;
};

export const uploadFile = async (parentFolderId, userBoxUserId, file = null) => {
  const accessToken = await client._session.getAccessToken();
  const newClient = sdk.getBasicClient(accessToken);

  const fileName = file || "demo.pdf";
  const filePath = path.join(process.cwd(), "public", "files", fileName);

  // ✅ Fix: use fs.promises
  const fileBuffer = await fs.promises.readFile(filePath);

  const existingItems = await newClient.folders.getItems(parentFolderId, {
    fields: "id,name",
  });

  const existingFile = existingItems.entries.find(
    (item) => item.name === fileName
  );

  if (existingFile) {
    // ✅ If file already exists, copy it to same folder
    const copiedFile = await newClient.files.copy(existingFile.id, parentFolderId);
    return copiedFile;
  } else {
    // ✅ Create stream and upload
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const uploadedFileRes = await newClient.files.uploadFile(
      parentFolderId,
      fileName,
      bufferStream
    );

    const uploadedFile = uploadedFileRes?.entries[0];

    const collaborations = await newClient.files.getCollaborations(uploadedFile.id);
    const isAlreadyCollaborator = collaborations.entries.some(
      (collab) =>
        collab.accessible_by && collab.accessible_by.id === userBoxUserId
    );

    if (!isAlreadyCollaborator) {
      await addCollaborator(uploadedFile.id, userBoxUserId, "editor", "file");
    }

    return uploadedFile;
  }
};

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
    const duplicateFiles = [];

    const folderItems = await newClient.folders.getItems(boxFolderId, {
      fields: "id,name",
    });

    for (const file of files) {
      const existingFile = folderItems.entries.find(
        (item) => item.name === file.name
      );

      if (existingFile) {
        console.log(`File "${file}" already exists, skipping upload.`);
        const arrayBuffer = await file.arrayBuffer();
        const base64File = Buffer.from(arrayBuffer).toString("base64");

        let streamObj = {
          name: file.name,
          type: file.type,
          size: file.size,
          base64: base64File, // This allows the frontend to reconstruct the file
        };
        duplicateFiles.push({
          id: existingFile.id,
          name: existingFile.name,
          type: existingFile.type,
          stream: streamObj,
        });
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileStream = new Readable();
      fileStream.push(buffer);
      fileStream.push(null);

      console.log("Uploading unique file:", file.name);

      const uploadedFileRes = await newClient.files.uploadFile(
        boxFolderId,
        file.name,
        fileStream,
        { description: email }
      );

      const uploadedFile = uploadedFileRes.entries[0];

      //Added user itself as collaborator for file with editor role
      const collaborations = await newClient.files.getCollaborations(
        uploadedFile.id
      );
      const isAlreadyCollaborator = collaborations.entries.some(
        (collab) => collab.accessible_by && collab.accessible_by.id === userId
      );
      if (!isAlreadyCollaborator) {
        await addCollaborator(uploadedFile.id, userId, "editor", "file");
      } else {
        console.log("User is already a collaborator");
      }
      uploadedFiles.push(uploadedFile);
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

async function updateName(itemId, newName, type) {
  const isFile = type === 'file';
  try {
    const accessToken = await client._session.getAccessToken();
    const newClient = sdk.getBasicClient(accessToken);
    const updatedItem = isFile
      ? await newClient.files.update(itemId, { name: newName }) // Update File Name
      : await newClient.folders.update(itemId, { name: newName }); // Update Folder Name

    console.log(`Updated ${isFile ? "File" : "Folder"} Name:`, updatedItem.name);
    return updatedItem;
  } catch (error) {
    console.error("Error updating name:", error.message);
    throw error;
  }
}

export async function PUT(req) {
  try {
    await logApiCall(req, () => {});
    const { itemId, newName, type } = await req.json();

   

    if (!itemId || !newName || !type) {
      return NextResponse.json(
        { error: "Missing required parameters: itemId, newName, or type" },
        { status: 400 }
      );
    }

    const updatedItem = await updateName(itemId, newName, type);

    return NextResponse.json({
      message: "File deleted successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: error.response?.body.message, details: error.message },
      { status: error.response?.statusCode || 500 }
    );
  }
}

export const deleteFile = async (fileId) => {
  const accessToken = await client._session.getAccessToken();
  const newClient = sdk.getBasicClient(accessToken);

  await newClient.files.delete(fileId);
};

export async function DELETE(req) {
  try {
    await logApiCall(req, () => {});
   
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "No fileId provided" },
        { status: 400 }
      );
    }

    await deleteFile(fileId);

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
