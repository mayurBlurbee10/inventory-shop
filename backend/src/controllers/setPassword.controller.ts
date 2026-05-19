import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import setPasswordService from "../services/setPassword.service.ts";
import { asyncHandler } from "../utils/helper.ts";

const getSetPassword = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);

    const token = req.query.token as string;
    if (!token) {
      return res.status(400).json({ error: "token is required." });
    }

    const selectedUser = await setPasswordService.getUserByToken(token);
    if (!selectedUser) {
      return res.status(404).json({ error: "Link may have expired." });
    }

    return res
      .status(200)
      .json({ data: selectedUser, message: "Valid link." });
  } catch (error) {
    console.error("Error in GET /api/setPassword:", error);
    return res.status(500).json({
      error: "Failed to set password",
      details: (error as Error).message,
    });
  }
});

const postSetPassword = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { token, password } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const message = await setPasswordService.setPasswordByToken(token, password);
    return res.status(200).json({ message });
  } catch (error) {
    console.error("Error in POST /api/setPassword:", error);
    return res.status(500).json({
      error: "Failed to set password",
      details: (error as Error).message,
    });
  }
});

export default {
  getSetPassword,
  postSetPassword,
};
