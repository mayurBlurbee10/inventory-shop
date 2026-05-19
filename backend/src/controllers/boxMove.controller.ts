import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { getBoxClient } from "../utils/box.ts";
import { asyncHandler } from "../utils/helper.ts";

const client = getBoxClient();

// POST /api/box/move
const moveItem = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { itemId, destinationFolderId, type } = req.body;
    await logApiCall(req);

    if (!itemId || !destinationFolderId || !type) {
      return res.status(400).json({
        error:
          "Missing required parameters: itemId, destinationFolderId, and type are mandatory.",
      });
    }

    if (type !== "file" && type !== "folder") {
      return res.status(400).json({
        error: "Invalid type. Accepted values are 'file' or 'folder'.",
      });
    }

    let response: any;

    if (type === "file") {
      response = await client.files.move(itemId, destinationFolderId);
    } else {
      response = await client.folders.move(itemId, destinationFolderId);
    }

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error moving file or folder:", error);
    return res.status(500).json({
      error: `Failed to move ${req.body.type === "file" ? "file" : "folder"}.`,
      details: (error as Error).message,
    });
  }
});

export default {
  moveItem,
};

