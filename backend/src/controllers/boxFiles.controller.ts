import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { addCollaborator, addCollaboratorId, getCollaboration, updateCollaboratorRole } from "../services/box.service.ts";
import { Readable } from "stream";
import { asyncHandler } from "../utils/helper.ts";
import fs from "fs";
import path from "path";
import { getBoxClient } from "../utils/boxClient.ts";
import portalService from "../services/portal.service.ts";

const client = getBoxClient();

// GET /api/box/files
const getFiles = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { folderId } = req.query;

    const data = await client.folders.getFolderItems(
      folderId?.toString() || "0",
    );
    return res.status(200).json(data?.entries);
  } catch (error) {
    console.error("Files error:", error);
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
});

const buildPrompt = (taskName: string) => `
  You are a document validation system.

  Task requirement: "${taskName}"

  Analyze the provided file and determine whether it satisfies the task.

  Rules:
  - Be strict. If unsure, return false.
  - Only return JSON (no extra text)
  - Base decision on visible content (text, structure, layout)
  - If the uploaded document contains form fields/entries, verify required fields are filled (not blank/placeholders). If key required fields are empty or cannot be verified, return false.
  - If the uploaded document contains signature boxes/lines/initial fields, verify signatures/initials are present where required. If missing or cannot be confidently verified, return false.

  Response format:
  {
    "isValid": boolean,
    "confidence": number (0-100),
    "reason": "short explanation",
    "userMessage": "simple message for end user explaining why valid or invalid"
  }
`;

const buildTaskContext = ({
  taskName,
  taskDescription,
  documentType,
}: {
  taskName?: string;
  taskDescription?: string;
  documentType?: string;
}) => {
  let context = "";
  if (taskName) {
    context += `Task Name: ${taskName}\n`;
  }
  if (taskDescription) {
    context += `Task Description: ${taskDescription}\n`;
  }
  if (documentType && documentType.toLowerCase() !== "other") {
    context += `Expected Document Type: ${documentType}\n`;
  }
  return context.trim();
};

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Retry if file not yet indexed
export const validateDocumentWithBoxAI = async (
  fileId: string,
  taskName: string,
  accessToken: string,
) => {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch("https://api.box.com/2.0/ai/ask", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "single_item_qa",
          prompt: buildPrompt(taskName),
          items: [
            {
              type: "file",
              id: fileId,
            },
          ],
          include_citations: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(
          `Attempt ${attempt} failed: ${response.status} - ${errorText}`,
        );
        if (response.status === 412) {
          await sleep(1500 * attempt);
          continue;
        }
        throw new Error(`Box AI Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data?.answer) {
        throw new Error("Invalid AI response structure");
      }

      return data;
    } catch (error: any) {
      console.log(`Error on attempt ${attempt}:`, error.message);
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt);
        continue;
      }

      throw new Error("Box AI failed after retries");
    }
  }
  throw new Error("Box AI failed after max retries");
};

export const parseAIResponse = (text: string) => {
  if (!text) {
    return fallback();
  }
  try {
    return JSON.parse(text);
  } catch (e) { }
  try {
    const jsonMatch = text.match(/\{[\s\S]*?\}/); // non-greedy
    if (!jsonMatch) throw new Error("No JSON found");

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    return fallback();
  }
};

const fallback = () => ({
  isValid: false,
  confidence: 0,
  reason: "Unable to parse AI response",
  userMessage: "We couldn't verify your document. Please try again.",
});

// POST /api/box/files
const uploadFiles = asyncHandler(async (req: Request, res: Response) => {
  try {
    // here userId is BoxUserId
    await logApiCall(req, () => { });
    const newClient = client;

    const files = ((req as any).files || []) as any[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const boxFolderId = (req.body.boxFolderId as string) || "0";
    const email = (req.body.email as string) || "";
    const userId = (req.body.userId as string) || "";

    const uploadedFiles: any[] = [];
    const duplicateFiles: any[] = [];

    const folderItems = await newClient.folders.getFolderItems(boxFolderId, {
      queryParams: {
        fields: ["id", "name", "type"],
        limit: 1000,
      },
    });

    for (const file of files) {
      const existingFile = (folderItems as any)?.entries?.find(
        (item: any) => item.name === file.originalname
      );

      if (existingFile) {
        console.log(
          `File "${file.originalname}" already exists; creating copy.`,
        );

        const copiedFileRes = await client.files.copyFile(existingFile.id, {
          parent: { id: boxFolderId },
        });

        const copiedFile = (copiedFileRes as any)?.entries?.[0] || copiedFileRes;

        if (!(copiedFile as any)?.id) {
          console.warn("Copy succeeded but no file payload returned:", copiedFileRes);
          continue;
        }

        duplicateFiles.push({
          id: existingFile.id,
          name: existingFile.name,
          type: "file",
          copiedFileId: (copiedFile as any)?.id,
          copiedFileName: (copiedFile as any)?.name,
        });

        uploadedFiles.push(copiedFile as any);
        await logApiCall(
          req,
          () => { },
          "file-upload-copy",
          null
        );
        continue;
      }

      const fileStream = new Readable();
      fileStream.push(file.buffer);
      fileStream.push(null);

      console.log("Uploading unique file:", file.originalname);

      const uploadedFileRes = await newClient.uploads.uploadFile({
        attributes: {
          name: file.originalname,
          parent: { id: boxFolderId },
        },
        file: fileStream,
      });

      const uploadedFile = uploadedFileRes?.entries?.[0];

      //Added user itself as collaborator for file with editor role
      const collaborations = await newClient.listCollaborations.getFileCollaborations(
        uploadedFile?.id!
      );
      const isAlreadyCollaborator = collaborations?.entries?.some(
        (collab: any) => collab.accessibleBy && collab.accessibleBy.id === userId
      );
      if (!isAlreadyCollaborator) {
        await addCollaborator(uploadedFile?.id!, userId, "editor", "file");
      } else {
        console.log("User is already a collaborator");
      }
      uploadedFiles.push(uploadedFile);
    }

    return res.status(200).json({
      message: "Upload completed (existing files skipped)",
      files: uploadedFiles,
      duplicateFiles: duplicateFiles,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return res.status((error as any)?.response?.statusCode || 500).json({
      error: (error as any)?.response?.body?.message,
      status: (error as any)?.response?.statusCode || 500,
    });
  }
});

async function updateName(itemId: string, newName: string, type: string) {
  const isFile = type === "file";
  try {
    const newClient = client;
    const updatedItem = isFile
      ? await newClient.files.updateFileById(itemId, {
        requestBody: { name: newName },
      }) // Update File Name
      : await newClient.folders.updateFolderById(itemId, {
        requestBody: { name: newName },
      }); // Update Folder Name


    console.log(
      `Updated ${isFile ? "File" : "Folder"} Name:`,
      updatedItem.name,
    );
    return updatedItem;
  } catch (error) {
    console.error("Error updating name:", (error as Error).message);
    throw error;
  }
}

// PUT /api/box/files
const updateFileName = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { itemId, newName, type } = req.body;

    await logApiCall(req);

    if (!itemId || !newName || !type) {
      return res.status(400).json({
        error: "Missing required parameters: itemId, newName, or type",
      });
    }

    const updatedItem = await updateName(itemId, newName, type);

    return res.status(200).json({
      message: "File updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error updating file:", error);
    return res.status(500).json({
      error: (error as any).response?.body?.message || (error as Error).message,
      details: (error as Error).message,
    });
  }
});

const deleteBoxFile = async (fileId: string) => {
  const newClient = client;

  await newClient.files.deleteFileById(fileId);
};

// DELETE /api/box/files
const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { fileId } = req.query;

    await logApiCall(req);

    if (!fileId) {
      return res.status(400).json({ error: "No fileId provided" });
    }

    await deleteBoxFile(fileId as string);

    return res.status(200).json({
      message: "File deleted successfully",
      fileId: fileId,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return res.status(500).json({
      error: (error as any).response?.body?.message || (error as Error).message,
      details: (error as Error).message,
    });
  }
});

// POST /api/box/files/duplicate
const duplicateFiles = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { items, destinationFolderId, userId } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !destinationFolderId) {
      return res.status(400).json({
        error:
          "Invalid request data: items and destinationFolderId are required.",
      });
    }

    const results: any[] = [];
    const errors: any[] = [];
    for (const item of items) {
      try {
        const copiedFile = await client.files.copyFile(item.id, {
          parent: { id: destinationFolderId },
        });
        // await addCollaborator(copiedFile.id, userId, "editor", "file");
        results.push(copiedFile);
      } catch (error) {
        console.error(`Failed to copy ${item.type} with ID ${item.id}:`, error);
        errors.push({
          id: item.id,
          type: item.type,
          error: (error as Error).message,
        });
      }
    }
    return res.status(200).json({
      message: "File uploaded successfully",
      files: results,
      failedItems: errors,
    });
  } catch (error) {
    console.error("Error file upload:", error);
    return res.status(500).json({
      error: "Failed to upload file",
      details: (error as Error).message,
    });
  }
});

// GET /api/box/files/organization
const getOrganizationFiles = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // await logApiCall(req);

      const { orgName, folderId, isAdvisor, portalid } = req.query;
      console.log(
        "getOrganizationFiles-Payload===============>",
        orgName,
        folderId,
        isAdvisor,
        portalid,
      );

      const newClient = client;

      if (isAdvisor) {
        const userService = (await import("../services/user.service.ts"))
          .default;
        const { UserRole } = await import("../config/constants.ts");
        const users = await userService.getUsersByPortal(portalid as string);

        console.log("users", users);
        let userFiles: any[] = [];

        for (const user of users) {
          if ((user as any).permissions?.role === UserRole.USER) {
            const { entries: files } = await newClient.folders.getFolderItems(
              (user as any).folderId,
              {
                queryParams: {
                  limit: 100,
                },
              },
            );
            userFiles = [...userFiles, ...files || []];
          }
        }

        return res.status(200).json({
          files: userFiles,
        });
      }

      if (!orgName || !folderId) {
        return res.status(400).json({
          error: "Missing required parameters",
        });
      }

      const { entries: files } = await newClient.folders.getFolderItems(
        folderId as string,
        {
          queryParams: {
            limit: 100,
          },
        },
      );

      return res.status(200).json({
        files: files,
      });
    } catch (error) {
      console.error("Error fetching files:", error);
      return res.status(500).json({
        error: "Failed to fetch files",
      });
    }
  },
);

// GET /api/box/files/proxy-file
const getProxyFile = async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { searchParams } = new URL(
      req.url,
      `${req.protocol}://${req.headers.host}`,
    );

    const fileUrl = searchParams.get("url")!;
    const fileType = searchParams.get("fileType") || "bin";
    const token = searchParams.get("token");

    if (!fileUrl) {
      res.status(400).json({ error: "File URL is required." });
    }

    const response = await fetch(fileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "*/*",
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: "Failed to fetch file." });
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="file.${fileType}"`,
    );
    res.send(buffer);
  } catch (error) {
    console.error("❌ Error fetching file:", error);
    res.status(500).json({
      error: "Failed to fetch file.",
      details: (error as Error).message,
    });
  }
};

// POST /api/box/files/replace
export const replaceFiles = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await logApiCall(req, () => { });
    const newClient = client;

    const files = ((req as any).files || []) as any[];

    const { boxFolderId = "0", email = "", userId = "" } = req.body;

    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }
    const uploadedFiles = [];

    const folderItems = await newClient.folders.getFolderItems(boxFolderId, {
      queryParams: {
        fields: ["id", "name"],
      },
    });

    for (const file of files) {
      const buffer = file.buffer;
      const fileName = file.originalname;

      const fileStream = new Readable();
      fileStream.push(buffer);
      fileStream.push(null);

      const existingFile = (folderItems as any).entries.find(
        (item: { name: string }) => item.name === fileName
      );

      if (existingFile) {
        const existingFileId = existingFile.id;
        console.log(`Replacing existing file: ${fileName}`);

        const updatedFile = await newClient.uploads.uploadFileVersion(
          existingFileId,
          {
            attributes: {
              name: "",
            },
            file: fileStream,
          },
        );
        uploadedFiles.push(updatedFile?.entries?.[0]);

      } else {
        console.log(`Uploading new file: ${fileName}`);

        const uploadedFileRes = await newClient.uploads.uploadFile({
          attributes: {
            name: fileName,
            parent: {
              id: boxFolderId,
            },
          },
          file: fileStream,
        });

        const uploadedFile = uploadedFileRes?.entries?.[0];

        await addCollaborator(uploadedFile?.id!, userId, "editor", "file");

        uploadedFiles.push(uploadedFile);
      }
    }

    res.status(200).json({
      message: "Files replaced successfully",
      files: uploadedFiles,
    });
  } catch (error: any) {
    console.error("Error replacing files:", error);
    res.status(500).json({
      error: error.response?.body?.message || error.message,
    });
  }
};

// GET /api/box/files/share
const getFileShare = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { fileId, isShareable } = req.query;

    if (!fileId || isShareable === undefined) {
      return res.status(400).json({
        error: "File ID and isShareable state are required.",
      });
    }

    let response: any;

    if (isShareable === "true") {
      response = await client.files.updateFileById(fileId as string, {
        requestBody: {
          sharedLink: {
            access: "open",
            permissions: {
              canDownload: true,
            },
          },
        },
      });
    } else {
      response = await client.files.updateFileById(fileId as string, {
        requestBody: {
          sharedLink: undefined,
        },
      });
    }

    const sharedLink =
      isShareable === "true"
        ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/shared-file/${fileId}`
        : null;

    return res.status(200).json({
      message:
        isShareable === "true"
          ? "Shared link generated successfully."
          : "Shared link removed successfully.",
      fileId: fileId,
      sharedLink: sharedLink,
    });
  } catch (error) {
    console.error("Error updating shared link:", error);
    return res.status(500).json({
      error: "Failed to update shared link.",
      details: (error as Error).message,
    });
  }
});

// POST /api/box/files/share
const addFileCollaborator = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const { itemId, userID, role, updateRole, type = "folder" } = req.body;

      if (!itemId || !userID || !role) {
        return res.status(400).json({
          error: "itemId, userID, and role are required.",
        });
      }

      let response: any;
      if (updateRole) {
        const collaborationId = itemId;
        if (!collaborationId) {
          return res.status(404).json({
            error: "Collaboration not found for the given userID and item.",
          });
        }
        response = await updateCollaboratorRole(collaborationId, role);
      } else {
        response = await addCollaborator(itemId, userID, role, type);
      }
      await addCollaboratorId(response.item.id, userID, role, type);

      return res.status(200).json({
        success: true,
        message: updateRole
          ? `User's role updated to ${role} successfully.`
          : `User invited as ${role} successfully.`,
        response,
      });
    } catch (error) {
      console.error("Error adding collaborator:", error);
      return res.status(500).json({
        error:
          (error as any).response?.body?.message ||
          "Failed to share item via userID",
        details: (error as Error).message,
      });
    }
  },
);

// DELETE /api/box/files/share
const removeFileCollaborator = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const { collaboratorId, userId } = req.query;
      if (!collaboratorId) {
        return res.status(400).json({
          error: "No collaboratorId provided",
        });
      }
      const collaboration = await getCollaboration(collaboratorId as string);

      await client.userCollaborations.deleteCollaborationById(collaboratorId as string);
      await addCollaboratorId(collaboration?.item?.id!, userId as string);

      return res.status(200).json({
        message: "Collaborator remove successfully",
      });
    } catch (error) {
      console.error("Error removing collaborator:", error);
      return res.status(500).json({
        error: "Failed to remove collaborator",
        details: (error as Error).message,
      });
    }
  },
);

// Helper function to recursively search for a folder by name
const findFolderByName = async (
  client: any,
  parentFolderId: string,
  targetFolderName: string,
  maxDepth: number = 3,
  currentDepth: number = 0,
): Promise<any> => {
  if (currentDepth >= maxDepth) {
    return null;
  }

  try {
    // Get all items in the current folder
    const folderItems = await client.folders.getFolderItems(parentFolderId, {
      queryParams: {
        fields: ["id", "name", "type"],
        limit: 1000,
      },
    });

    // First, check direct children for exact match (case-insensitive)
    const directMatch = folderItems.entries.find(
      (entry: any) =>
        entry.type === "folder" &&
        entry.name.toLowerCase() === targetFolderName.toLowerCase(),
    );

    if (directMatch) {
      return directMatch;
    }

    // If not found in direct children, recursively search subfolders
    const subfolders = folderItems.entries.filter(
      (entry: any) => entry.type === "folder",
    );

    for (const subfolder of subfolders) {
      const found = await findFolderByName(
        client,
        subfolder.id,
        targetFolderName,
        maxDepth,
        currentDepth + 1,
      );
      if (found) {
        return found;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error searching folder ${parentFolderId}:`, error);
    return null;
  }
};

// POST /api/box/files/upload-edited
export const uploadEditedFile = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const newClient = client;

      const files = ((req as any).files || []) as any[];
      const {
        originalFileId = "",
        boxFolderId = "0",
        email = "",
        userId = "",
      } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      if (!originalFileId) {
        return res.status(400).json({ error: "originalFileId is required" });
      }

      const uploadedFiles = [];

      for (const file of files) {
        const buffer = file.buffer;
        const originalFileName = file.originalname;

        // Get original file info to find its parent folder
        const originalFileInfo = await newClient.files.getFileById(
          originalFileId,
          {
            queryParams: {
              fields: ["name", "parent"],
            },
          },
        );

        // Determine the folder to upload to (use parent folder of original file)
        const targetFolderId = originalFileInfo.parent?.id || boxFolderId;

        // Create edited file name (add _edited suffix before extension)
        const fileNameParts = originalFileName.split(".");
        const extension = fileNameParts.pop();
        const baseName = fileNameParts.join(".");
        const editedFileName = `${baseName}_edited.${extension}`;

        // Check if edited file already exists, if so delete it first
        try {
          const folderItems = await newClient.folders.getFolderItems(
            targetFolderId,
            {
              queryParams: {
                fields: ["id", "name", "type"],
                limit: 1000,
              },
            },
          );

          const existingEditedFile = folderItems?.entries?.find(
            (item: any) =>
              item.type === "file" &&
              item.name.toLowerCase() === editedFileName.toLowerCase(),
          );

          if (existingEditedFile) {
            // Delete existing edited file to replace it
            await newClient.files.deleteFileById(existingEditedFile.id);
          }
        } catch (checkError) {
          console.log(
            "Error checking for existing file (continuing):",
            checkError,
          );
          // Continue with upload even if check fails
        }

        const fileStream = new Readable();
        fileStream.push(buffer);
        fileStream.push(null);

        // Upload as new file (not replacing)
        const uploadedFileRes = await newClient.uploads.uploadFile({
          attributes: {
            name: editedFileName,
            parent: {
              id: targetFolderId,
            },
          },
          file: fileStream,
        });

        // Handle both response formats (entries array or direct object)
        const uploadedFile = uploadedFileRes?.entries?.[0];

        // Add collaborator if userId provided
        if (userId) {
          try {
            await addCollaborator(uploadedFile?.id!, userId, "editor", "file");
          } catch (collabError) {
            console.log("Error adding collaborator (continuing):", collabError);
            // Continue even if collaborator add fails
          }
        }

        uploadedFiles.push(uploadedFile);
      }

      return res.status(200).json({
        message: "Edited file uploaded successfully",
        files: uploadedFiles,
        editedFileId: uploadedFiles[0]?.id,
      });
    } catch (error: any) {
      console.error("Error uploading edited file:", error);
      return res.status(500).json({
        error: error.response?.body?.message || error.message,
        details: (error as Error).message,
      });
    }
  },
);

// GET /api/box/files/by-folder-and-name
const getFileByFolderAndName = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const { folderName, fileName, userId } = req.query;

      if (!folderName || !fileName) {
        return res.status(400).json({
          error: "folderName and fileName are required",
        });
      }

      const newClient = client;

      // Determine the root folder to search in
      let rootFolderId: string;

      if (userId) {
        // userId is actually the user's boxFolderId (root folder like "User's Files")
        rootFolderId = userId as string;
      } else {
        // If no userId provided, search from root (0)
        rootFolderId = "0";
      }

      console.log(
        `Searching for folder "${folderName}" in root folder: ${rootFolderId}`,
      );

      // Recursively search for the folder
      let targetFolder = await findFolderByName(
        newClient,
        rootFolderId,
        folderName as string,
        5, // Max depth of 5 levels
      );

      if (!targetFolder) {
        console.log(`Folder "${folderName}" not found. Creating it...`);
        try {
          targetFolder = await newClient.folders.createFolder({
            name: folderName as string,
            parent: { id: rootFolderId },
          });
          console.log(
            `Created folder "${folderName}" with ID: ${targetFolder.id}`,
          );
        } catch (createFolderError) {
          console.error(
            `Error creating folder "${folderName}":`,
            createFolderError,
          );
          return res.status(500).json({
            error: `Failed to create folder "${folderName}"`,
            details: (createFolderError as Error).message,
          });
        }
      }

      console.log(`Found folder "${folderName}" with ID: ${targetFolder.id}`);

      // Get all items in the found folder
      const folderItems = await newClient.folders.getFolderItems(
        targetFolder.id,
        {
          queryParams: { fields: ["id,name,type"], limit: 1000 },
        },
      );


      // Find the file (case-insensitive match) - prioritize original file over edited
      let originalFile = folderItems?.entries?.find(
        (entry: any) =>
          entry.type === "file" &&
          entry.name.toLowerCase() === (fileName as string).toLowerCase(),
      );

      if (!originalFile) {
        console.log(
          `File "${fileName}" not found in folder "${folderName}". Checking public directory...`,
        );
        const pdfPath = path.join(process.cwd(), "public", fileName as string);

        if (fs.existsSync(pdfPath)) {
          console.log(`File found in public directory. Uploading to Box...`);
          const pdfBuffer = fs.readFileSync(pdfPath);
          const fileStream = new Readable();
          fileStream.push(pdfBuffer);
          fileStream.push(null);

          try {
            const uploadedFileRes = await newClient.uploads.uploadFile({
              attributes: {
                name: fileName as string,
                parent: {
                  id: targetFolder.id,
                },
              },
              file: fileStream,
            });
            originalFile = uploadedFileRes?.entries?.[0];

            console.log(
              `Successfully uploaded "${fileName}" with ID: ${originalFile?.id}`,
            );
          } catch (uploadError) {
            console.error(`Error uploading file "${fileName}":`, uploadError);
            return res.status(500).json({
              error: `Failed to upload file "${fileName}"`,
              details: (uploadError as Error).message,
            });
          }
        } else {
          console.warn(
            `File "${fileName}" not found in public directory at ${pdfPath}`,
          );
          return res.status(404).json({
            error: `File "${fileName}" not found in folder "${folderName}" or public directory`,
            details: `Searched in folder ${targetFolder.id} and public directory.`,
          });
        }
      }

      if (originalFile) {
        return res.status(200).json({
          fileId: originalFile?.id,
          fileName: originalFile?.name,
          folderName: folderName,
          folderId: targetFolder?.id,
        });
      }

      // If original not found, return 404
      return res.status(404).json({
        error: `File "${fileName}" not found in folder "${folderName}"`,
        details: `Found folder but file not found. Available files: ${folderItems?.entries
          ?.filter((e: any) => e.type === "file")
          ?.map((e: any) => e.name)
          ?.join(", ")}`,
      });
    } catch (error) {
      console.error("Error finding or creating file/folder:", error);
      return res.status(500).json({
        error: "Failed to find or create file",
        details: (error as Error).message,
      });
    }
  },
);

export const getFileInfo = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { fileId } = req.query;
    if (!fileId) {
      return res.status(400).json({ error: "fileId is required." });
    }
    const newClient = client;
    const fileInfo = await newClient.files.getFileById(fileId as string, {
      queryParams: { fields: ["id,name,size,created_at"] },
    });
    return res.status(200).json({
      fileId: fileInfo.id,
      fileName: fileInfo.name,
      size: fileInfo.size,
      createdAt: fileInfo.createdAt,
    });
  } catch (error: any) {
    console.error("Error getting file info:", error);
    return res.status(500).json({
      error: error.response?.body?.message || error.message,
    });
  }
});

export const uploadEnterpriseFile = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      await logApiCall(req);
      const files = ((req as any).files || []) as any[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      const file = files[0];
      const portalId = req.body.portal;
      let TEMPLATE_FOLDER_ID = "0";

      if (portalId) {
        try {
          const portal = await portalService.getPortalById(portalId);
          if (
            portal &&
            portal.portalCreatedAdmin &&
            portal.portalCreatedAdmin.folderId
          ) {
            TEMPLATE_FOLDER_ID = portal.portalCreatedAdmin.folderId;
            console.log(
              `[boxFiles] Using portal admin folder for upload: ${TEMPLATE_FOLDER_ID}`,
            );
          } else {
            console.warn(
              `[boxFiles] Could not find admin folder for portal ${portalId}. Falling back to root.`,
            );
          }
        } catch (portalErr: any) {
          console.error(
            `[boxFiles] Error resolving portal folder:`,
            portalErr.message,
          );
        }
      }

      // Helper to create a new stream for each attempt
      const getStream = () => {
        const stream = new Readable();
        stream.push(file.buffer);
        stream.push(null);
        return stream;
      };

      // 1. Initial check (Same as uploadFiles flow)
      const folderItems = await client.folders.getFolderItems(
        TEMPLATE_FOLDER_ID,
        {
          queryParams: { fields: ["id", "name"], limit: 1000 },
        },
      );

      const existing = folderItems?.entries?.find(
        (f: any) => f.name === file.originalname,
      );

      let uploadedFile: any;

      if (existing) {
        console.log(
          `File "${file.originalname}" already exists. Using "copy" flow.`,
        );
        try {
          // Normal flow: try to copy (duplicate)
          uploadedFile = await client.files.copyFile(existing.id, {
            parent: {
              id: TEMPLATE_FOLDER_ID,
            },
          });
        } catch (copyErr: any) {
          // Extra flow: fallback to version update on any error
          console.log("Copy failed, falling back to version update.");
          const versioned = await client.uploads.uploadFileVersion(
            existing.id,
            {
              attributes: {
                // name: newFileName!,
                name: "", // Will take original name automatically if not set new name
              },
              file: getStream(),
            },
          );
          uploadedFile = versioned.entries ? versioned.entries[0] : versioned;
        }
      } else {
        // Unique file: standard upload
        try {
          const uploaded = await client.uploads.uploadFile({
            attributes: {
              name: file.originalname,
              parent: { id: TEMPLATE_FOLDER_ID },
            },
            file: getStream(),
          });
          uploadedFile = uploaded.entries ? uploaded.entries[0] : uploaded;
        } catch (uploadErr: any) {
          // Handing 409 Conflict (e.g. if file didn't appear in first 1000 items)
          if (
            uploadErr.status === 409 ||
            uploadErr.message?.includes("already exists")
          ) {
            console.log(
              "Conflict detected during upload. Attempting to find ID for versioning.",
            );

            let existingId = "";

            // A. Check context_info.conflicts (Most reliable/direct)
            const conflicts = uploadErr.response?.body?.context_info?.conflicts;
            if (conflicts && conflicts.length > 0) {
              existingId = conflicts[0].id;
            }

            // B. Fallback: Search for the file ID specifically
            if (!existingId) {
              try {
                const searchRes = await client.search.searchForContent({
                  query: `"${file.originalname}"`,
                  ancestorFolderIds: [TEMPLATE_FOLDER_ID],
                  limit: 10,
                  fields: ["id", "name"],
                }) as any;
                const match = searchRes?.entries?.find(
                  (f: any) => f.name === file.originalname,
                );
                if (match) existingId = match?.id;
              } catch (sErr) {
                console.error("Search fallback failed:", sErr);
              }
            }

            if (existingId) {
              const versioned = await client.uploads.uploadFileVersion(
                existingId,
                {
                  attributes: {
                    name: "", // Will take original name automatically if not set new name
                  },
                  file: getStream(),
                },
              );
              uploadedFile = versioned.entries
                ? versioned.entries[0]
                : versioned;
            } else {
              // If we still can't find it, bubble up the original conflict
              throw uploadErr;
            }
          } else {
            throw uploadErr;
          }
        }
      }

      return res.status(200).json({
        message: "File uploaded successfully.",
        fileId: uploadedFile.id,
        fileName: uploadedFile.name,
      });
    } catch (error: any) {
      console.error("Error uploading enterprise file:", error);
      return res.status(500).json({
        error: error.response?.body?.message || error.message,
      });
    }
  },
);

export default {
  getFiles,
  uploadFiles,
  updateFileName,
  deleteFile,
  duplicateFiles,
  getOrganizationFiles,
  getProxyFile,
  replaceFiles,
  uploadEditedFile,
  getFileShare,
  addFileCollaborator,
  removeFileCollaborator,
  getFileByFolderAndName,
  uploadEnterpriseFile,
  getFileInfo,
};
