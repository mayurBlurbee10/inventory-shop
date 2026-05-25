import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { getBoxClient } from "../utils/boxClient.ts";
import { asyncHandler } from "../utils/helper.ts";

const client = getBoxClient();
// GET /api/box/search
const searchFiles = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }
    const { q, userId } = req.query;

    const data = await client.search.searchForContent({
      query: q?.toString().trim(),
      ancestorFolderIds: [userId?.toString()!],
    });
    return res.status(200).json(data.entries);
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
});

export default {
  searchFiles,
};

