import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { uploadToAzureBlob } from "../utils/blobStorage.ts";
import path from "path";
import { asyncHandler } from "../utils/helper.ts";

const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `logo-${uniqueSuffix}${path.extname(file.originalname)}`;

    const url = await uploadToAzureBlob(file, filename);

    return res.status(200).json({ url });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({
      error: "Error uploading file",
    });
  }
});

export default {
  uploadFile,
};

