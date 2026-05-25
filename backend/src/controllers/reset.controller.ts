import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import resetService from "../services/reset.service.ts";
import { asyncHandler } from "../utils/helper.ts";

const resetPortal = asyncHandler(async (req: Request, res: Response) => {
  await logApiCall(req);

  const { portalId } = req.body;

  if (!portalId) {
    return res.status(400).json({ error: "portalid is required" });
  }

  try {
    await resetService.resetPortal(portalId);

    return res.status(200).json({
      message: "Portal data reset successfully.",
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to reset portal.",
      details: (error as Error).message,
    });
  }
});

export default {
  resetPortal,
};
