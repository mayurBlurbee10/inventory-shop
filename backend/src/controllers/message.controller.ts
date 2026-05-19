import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import messageService from "../services/message.service.ts";
import { asyncHandler } from "../utils/helper.ts";

const createMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const data = req.body;
    let { text, receiverId, portalId } = data;
    const senderId = (req as any).user?.id;
    if (!senderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!text) {
      return res.status(400).json({
        error: "Message text is required",
      });
    }
    const payload = {
      ...data,
      sender: { id: senderId },
      receiver: receiverId ? { id: receiverId } : data.receiver,
      portal: portalId || data.portalId,
    };

    const message = await messageService.createMessage(payload);

    if (!message) {
      return res.status(404).json({
        error: `Message didn't send. Please try again.`,
      });
    }
    return res.status(200).json({
      message: `message created successfully.`,
      data: message,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to create message.",
      details: (error as Error).message,
    });
  }
});

const getMessages = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { portalId, senderId, receiverId } = req.query;

    if (!!portalId && !!senderId && !!receiverId) {
      const messages = await messageService.getMessages(
        senderId as string,
        receiverId as string,
        portalId as string
      );
      return res.status(200).json({
        message: `messages retrieved successfully.`,
        data: messages || [],
      });
    }

    if (!!portalId && !!senderId) {
      const messages = await messageService.getUserMessages(
        senderId as string,
        portalId as string
      );
      return res.status(200).json({
        message: `messages retrieved successfully.`,
        data: messages || [],
      });
    }
    return res.status(400).json({ error: "Invalid query parameters" });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve messages.",
      details: (error as Error).message,
    });
  }
});

const updateMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { messageId, ...rest } = req.body;
    const message = await messageService.updateMessage(messageId, rest);

    if (!message) {
      return res.status(404).json({
        error: `Message didn't updated. Please try again.`,
      });
    }
    return res.status(200).json({
      message: `message updated successfully.`,
      data: message,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to update message.",
      details: (error as Error).message,
    });
  }
});

const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);
    const { messageId } = req.body;
    await messageService.deleteMessage(messageId);

    return res.status(200).json({
      message: `message deleted successfully.`,
    });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    return res.status(500).json({
      error: "Failed to delete message.",
      details: (error as Error).message,
    });
  }
});

export default {
  createMessage,
  getMessages,
  updateMessage,
  deleteMessage,
};

