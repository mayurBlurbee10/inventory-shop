import { Request, Response } from "express";
import { asyncHandler } from "../utils/helper.ts";
import { getBoxClient } from "../utils/boxClient.ts";

const client = getBoxClient();

// GET /api/box/download
const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { fileId } = req.query;
    if (!fileId) {
      return res.json({ error: "File ID is required" });
    }

    const file = await client.files.getFileById(fileId as string);

    const stream = await client.downloads.downloadFile(fileId as string);

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);

    stream?.on("data", (chunk: Buffer) => {
      res.write(chunk);
    });

    stream?.on("end", () => {
      res.end();
    });

    stream?.on("error", (err: Error) => {
      console.error("Stream error:", err);
      res.status(500).json({ error: "Stream error" });
    });
  } catch (error) {
    console.error("Error downloading file from Box:", error);
    return res.status((error as any)?.response?.statusCode || 500).json({
      error: "Failed to download file",
    });
  }
});

export default {
  downloadFile,
};

