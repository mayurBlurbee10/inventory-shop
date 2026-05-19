import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { getBoxClient, getBoxSDK } from "../utils/box.ts";
import userService from "../services/user.service.ts";
import { asyncHandler } from "../utils/helper.ts";

const client = getBoxClient();
const sdk = getBoxSDK();

// GET /api/box/comment
const getComments = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);

    const { fileId } = req.query;

    if (!fileId) {
      return res.status(400).json({
        error: "Missing fileId parameter",
      });
    }

    const data = await client.files.getComments(fileId as string);

    const comments = data.entries;

    console.log("comments", comments);

    const enrichedComments = await Promise.all(
      comments.map(async (comment: any) => {
        try {
          const user = await userService.getUserByBoxUserId(
            comment.created_by.id
          );
          return {
            ...comment,
            user,
          };
        } catch (error) {
          console.error(
            `Error fetching user for comment ${comment.id}:`,
            error
          );
          return {
            ...comment,
            user: null,
          };
        }
      })
    );

    return res.status(200).json({
      message: "Comments retrieved successfully",
      data: enrichedComments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({
      error: "Failed to retrieve comments." + (error as any).response?.body?.message,
      details: (error as Error).message,
    });
  }
});

// POST /api/box/comment
const createComment = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);

    const { fileId, message, boxUserId } = req.body;

    if (!fileId || !message || !boxUserId) {
      return res.status(400).json({
        error: "Missing required parameters",
      });
    }
    const newClient = sdk.getAppAuthClient("user", boxUserId);
    const comment = await newClient.comments.create(fileId, message);

    return res.status(200).json({
      message: "Comment added successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Error creating sign request:", error);
    return res.status(500).json({
      error: (error as any).response?.body?.message || (error as Error).message,
      details: (error as Error).message,
    });
  }
});

export default {
  getComments,
  createComment,
};

