import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { getBoxClient, getBoxSDK } from "../utils/box.ts";
import { asyncHandler } from "../utils/helper.ts";

const client = getBoxClient();
const sdk = getBoxSDK();

// POST /api/box/bulk/copy
const bulkCopy = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { items, destinationFolderId } = req.body;
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
        if (item.type === "file") {
          const movedFile = await client.files.copy(
            item.id,
            destinationFolderId
          );
          results.push({
            id: item.id,
            type: "file",
            status: "moved",
            movedFile,
          });
        } else if (item.type === "folder") {
          const movedFolder = await client.folders.copy(
            item.id,
            destinationFolderId
          );
          results.push({
            id: item.id,
            type: "folder",
            status: "moved",
            movedFolder,
          });
        } else {
          throw new Error(`Unsupported item type: ${item.type}`);
        }
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
      message: "Bulk copy operation completed",
      movedItems: results,
      failedItems: errors,
    });
  } catch (error) {
    console.error("Error bulk moving files or folders:", error);
    return res.status(500).json({
      error: "Failed to copy files or folders.",
      details: (error as Error).message,
    });
  }
});

// POST /api/box/bulk/delete
const bulkDelete = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { items } = req.body;

    const accessToken = await (client as any)._session.getAccessToken();
    const newClient = sdk.getBasicClient(accessToken);

    const results: any[] = [];
    const errors: any[] = [];

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
        console.error(
          `Failed to delete ${item.type} with ID ${item.id}:`,
          err
        );
        errors.push({
          id: item.id,
          type: item.type,
          error: (err as Error).message,
        });
      }
    }

    return res.status(200).json({
      message: "Bulk delete operation completed",
      deletedItems: results,
      failedItems: errors,
    });
  } catch (error) {
    console.error("Error bulk deleting files or folders:", error);
    return res.status(500).json({
      error: "Failed to delete files or folders.",
      details: (error as Error).message,
    });
  }
});

// POST /api/box/bulk/download
const bulkDownload = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Invalid request data: items are required",
      });
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const item of items) {
      try {
        if (item.type === "file") {
          const file = await client.files.get(item.id);

          const stream = await client.files.getReadStream(item.id);

          const chunks: Buffer[] = [];
          await new Promise<void>((resolve, reject) => {
            stream.on("data", (chunk: any) => {
              chunks.push(chunk);
            });

            stream.on("end", resolve);
            stream.on("error", reject);
          });

          const fileBuffer = Buffer.concat(chunks);

          results.push({
            id: item.id,
            name: item.name,
            contentType:
              file.file_version.content_type || "application/octet-stream",
            content: fileBuffer.toString("base64"),
          });
        } else {
          throw new Error(`Unsupported item type: ${item.type}`);
        }
      } catch (error) {
        console.error(
          `Failed to download ${item.type} with ID ${item.id}:`,
          error
        );
        errors.push({
          id: item.id,
          type: item.type,
          error: (error as Error).message,
        });
      }
    }

    return res.status(200).json({
      message: "Bulk download operation completed",
      downloadItems: results,
      failedItems: errors,
    });
  } catch (error) {
    console.error("Error downloading files from Box:", error);
    return res.status(500).json({
      error: "Failed to download files",
    });
  }
});

// POST /api/box/bulk/move
const bulkMove = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { items, destinationFolderId } = req.body;
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
        if (item.type === "file") {
          const movedFile = await client.files.move(
            item.id,
            destinationFolderId
          );
          results.push({
            id: item.id,
            type: "file",
            status: "moved",
            movedFile,
          });
        } else if (item.type === "folder") {
          const movedFolder = await client.folders.move(
            item.id,
            destinationFolderId
          );
          results.push({
            id: item.id,
            type: "folder",
            status: "moved",
            movedFolder,
          });
        } else {
          throw new Error(`Unsupported item type: ${item.type}`);
        }
      } catch (error) {
        console.error(`Failed to move ${item.type} with ID ${item.id}:`, error);
        errors.push({
          id: item.id,
          type: item.type,
          error: (error as Error).message,
        });
      }
    }
    return res.status(200).json({
      message: "Bulk move operation completed",
      movedItems: results,
      failedItems: errors,
    });
  } catch (error) {
    console.error("Error bulk moving files or folders:", error);
    return res.status(500).json({
      error: "Failed to move files or folders.",
      details: (error as Error).message,
    });
  }
});

export default {
  bulkCopy,
  bulkDelete,
  bulkDownload,
  bulkMove,
};

