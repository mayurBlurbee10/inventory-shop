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

    const folderSearch = await client.search.query(folderName, {
      type: "folder",
      fields: "id",
      ancestor_folder_ids: parentFolderId
    });
    console.log(`folder ${folderName}`, folderSearch)
    let folderId;
    if (!folderSearch.entries.length) {
      const createdFolder = await newClient.folders.create(parentFolderId, folderName);
      folderId = createdFolder.id;
      uploadedFolders.push({ name: folderName, id: folderId });
    } else {
      folderId = folderSearch.entries[0].id;
      uploadedFolders.push({ name: folderName, id: folderId });
    }

    const files = fs
      .readdirSync(localFolderPath)
      .filter((file) => fs.statSync(path.join(localFolderPath, file)).isFile());

    for (const fileName of files) {
      const filePath = path.join(localFolderPath, fileName);
      const buffer = fs.readFileSync(filePath);

      const fileSearch = await client.search.query(fileName, {
        type: "file",
        fields: "id",
        ancestor_folder_ids: folderId
      });
      console.log(`file ${fileName}`, fileSearch)
      let fileId;
      if (!fileSearch.entries.length) {
        const fileStream = new Readable();
        fileStream.push(buffer);
        fileStream.push(null);

        const uploadedFileRes = await newClient.files.uploadFile(
          folderId,
          fileName,
          fileStream,
          { description: email }
        );

        fileId = uploadedFileRes.entries[0].id;
      } else {
        fileId = fileSearch.entries[0].id;
      }

      const collaborations = await newClient.files.getCollaborations(fileId);
      const isAlreadyCollaborator = collaborations.entries.some(
        (collab) => collab.accessible_by && collab.accessible_by.id === userId
      );

      if (!isAlreadyCollaborator) {
        await addCollaborator(fileId, userId, 'editor', 'file');
      }
    }
  }

  // Create folders manually if not already present
  const defaultFolders = ["Loan", "Statements"];
  for (const folderName of defaultFolders) {
    const folderSearch = await client.search.query(folderName, {
      type: "folder",
      fields: "id",
      ancestor_folder_ids: parentFolderId
    });

    if (!folderSearch.entries.length) {
      const createdFolder = await newClient.folders.create(parentFolderId, folderName);
      uploadedFolders.push({ name: folderName, id: createdFolder.id });
    } else {
      uploadedFolders.push({ name: folderName, id: folderSearch.entries[0].id });
    }
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
        console.log(`File "${file.name}" already exists; creating copy.`);


        const copiedFileRes = await newClient.files.copy(
          existingFile.id,
          boxFolderId,
        );
        const copiedFile = copiedFileRes?.entries?.[0] || copiedFileRes;

        if (!copiedFile?.id) {
          console.warn("Copy succeeded but no file payload returned:", copiedFileRes);
          continue;
        }

        duplicateFiles.push({
          id: existingFile.id,
          name: existingFile.name,
          type: "file",
          copiedFileId: copiedFile?.id,
          copiedFileName: copiedFile?.name,
        });

        uploadedFiles.push(copiedFile);
        await logApiCall(req, () => {}, "file-upload-copy", null, copiedFile?.id);
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
