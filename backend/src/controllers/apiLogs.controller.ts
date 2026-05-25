import { Request, Response } from "express";
import apiLogsService from "../services/apiLogs.service.ts";
import { asyncHandler } from "../utils/helper.ts";

const createApiLog = asyncHandler(async (req: Request, res: Response) => {
  try {
    await apiLogsService.createApiLogFromRequest(req);
    return res.status(201).json({ message: "API log created" });
  } catch (error) {
    console.error("Failed to log API call:", error);
    return res.status(500).json({ error: "Failed to log API call" });
  }
});

export default {
  createApiLog,
};

