import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { asyncHandler } from "../utils/helper.ts";
import { getBoxClient } from "../utils/boxClient.ts";

const client = getBoxClient();

// GET /api/box/share
const getSharedFile = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { fileId } = req.query;

    if (!fileId) {
      return res.status(400).json({ error: "File ID is required." });
    }

    const fileDetails = await client.files.getFileById(fileId as string);

    if (!fileDetails) {
      return res.status(404).json({ error: "File not found." });
    }

    const isShareable = fileDetails.sharedLink !== null;

    if (!isShareable) {
      return res.status(403).json({
        error: "This file is not shareable.",
      });
    }

    const fileStream = await client.downloads.downloadFile(fileId as string);

    if (!fileStream) {
      return res.status(404).json({ error: "File not found." });
    }

    const mimeType: any = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      mp4: "video/mp4",
      mp3: "audio/mp3",
      svg: "image/svg+xml",
    };

    const extension = fileDetails?.name?.split(".")[1];

    res.setHeader(
      "Content-Type",
      mimeType[extension!] || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileDetails.name}"`
    );

    fileStream.on("data", (chunk: any) => {
      res.write(chunk);
    });

    fileStream.on("end", () => {
      res.end();
    });

    fileStream.on("error", (err: any) => {
      console.error("Stream error:", err);
      res.status(500).json({ error: "Stream error" });
    });
  } catch (error) {
    console.error("Error updating shared link:", error);
    return res.status(500).json({
      error: "Failed to update shared link.",
      details: (error as Error).message,
    });
  }
});

export default {
  getSharedFile,
};

