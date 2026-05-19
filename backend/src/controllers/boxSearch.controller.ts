import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { searchBoxAppUserContent } from "../utils/box.ts";
import { asyncHandler } from "../utils/helper.ts";

// GET /api/box/search
const searchFiles = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const { q, userId } = req.query;

    const data = await searchBoxAppUserContent(
      token,
      userId as string,
      q as string
    );
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

