import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { getBoxClient } from "../utils/box.ts";
import { asyncHandler } from "../utils/helper.ts";

const client = getBoxClient();

// GET /api/box/preview/:fileId
const getPreview = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { fileId } = req.params;

    // Get the service account token
    const accessToken = await (client as any)._session.getAccessToken();

    // Get file info
    const file = await client.files.get(fileId);

    return res.status(200).json({
      accessToken,
      fileInfo: {
        id: (file as any).id,
        name: (file as any).name,
        type: (file as any).type,
      },
    });
  } catch (error) {
    console.error("Box preview error:", error);
    return res.status(500).json({
      error: "Failed to generate preview",
      details: (error as Error).message,
    });
  }
});

export default {
  getPreview,
};

