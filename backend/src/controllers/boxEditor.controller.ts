import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import path from "path";
import { asyncHandler } from "../utils/helper.ts";
import { getBoxClient } from "../utils/boxClient.ts";
import { Readable } from "stream";

const client = getBoxClient();

// GET /api/box/editor
const getEditorLink = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const fileId = typeof req.query.fileId === "string" ? req.query.fileId : "";

    if (!fileId) {
      res.status(400).json({ error: "File ID is required." });
      return;
    }

    // Generate a shared link with preview (view/edit) permission
    const fileInfo = await client.files.updateFileById(fileId as string, {
      requestBody: {
        sharedLink: {
          access: "open",
          permissions: { canDownload: true },
        },
      },
    });

    if (!fileInfo.sharedLink?.downloadUrl) {
      res.status(500).json({ error: "Could not generate file link." });
      return;
    }

    const fileType = path.extname(fileInfo.name!).replace(".", "");

    res.status(200).json({
      fileUrl: fileInfo.sharedLink.downloadUrl,
      fileType,
    });
  } catch (error: any) {
    console.error("Error generating file link:", error);
    res.status(error.response?.statusCode || 500).json({
      error: error.response?.body?.message || "Failed to generate file link",
      details: error.message,
    });
  }
});

// POST /api/box/editor
const saveEditorFile = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req, () => { });
    const body = req.body;

    if (body.status !== 2 || !body.url) {
      return res.status(200).json({
        message: "No document saved yet",
      });
    }

    const fileId = body.customization?.fileId;
    if (!fileId) {
      throw new Error("File ID is missing in callback request");
    }

    const response = await fetch(body.url);
    const fileBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    const stream = Readable.from(buffer);

    const newClient = client;

    const updatedFile = await newClient.uploads.uploadFileVersion(
      fileId,
      {
        attributes: {
          name: "",
        },
        file: stream
      }
    );

    return res.status(200).json({
      message: "Files replaced successfully",
      files: updatedFile,
    });
  } catch (error) {
    console.error("Error replacing files:", error);
    return res.status(500).json({
      error: (error as any).response?.body?.message || (error as Error).message,
    });
  }
});

export default {
  getEditorLink,
  saveEditorFile,
};

