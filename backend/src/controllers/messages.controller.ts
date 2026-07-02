import { Request, Response } from "express";
import { logApiCall } from "../utils/api-log-middleware.ts";
import { asyncHandler } from "../utils/helper.ts";
import messagesService from "../services/messages.service.ts";

const getCurrentUserId = (req: Request) => (req as any).user?.id as string | undefined;

const getMessages = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);

    const currentUserId = getCurrentUserId(req);
    const { portalId, receiverId, senderId } = req.query;

    if (!currentUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!portalId) {
      return res.status(400).json({ error: "portalId is required" });
    }

    if (senderId && senderId !== currentUserId) {
      return res.status(403).json({ error: "Cannot access another user's messages" });
    }

    const messages = receiverId
      ? await messagesService.getConversationMessages(
          currentUserId,
          receiverId as string,
          portalId as string,
        )
      : await messagesService.getUserMessages(currentUserId, portalId as string);

    return res.status(200).json({
      message: "messages retrieved successfully.",
      data: messages || [],
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to retrieve messages.",
      details: (error as Error).message,
    });
  }
});

const createMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);

    const currentUserId = getCurrentUserId(req);
    const { text, receiverId, portalId } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!text?.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    if (!receiverId) {
      return res.status(400).json({ error: "receiverId is required" });
    }

    if (!portalId) {
      return res.status(400).json({ error: "portalId is required" });
    }

    const message = await messagesService.createMessage({
      senderId: currentUserId,
      receiverId,
      portalId,
      text: text.trim(),
    });

    return res.status(200).json({
      message: "message created successfully.",
      data: message,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create message.",
      details: (error as Error).message,
    });
  }
});

const updateMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);

    const currentUserId = getCurrentUserId(req);
    const { messageId, portalId, text } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!messageId || !portalId || !text?.trim()) {
      return res.status(400).json({
        error: "messageId, portalId and text are required",
      });
    }

    const message = await messagesService.updateMessage({
      messageId,
      senderId: currentUserId,
      portalId,
      text: text.trim(),
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    return res.status(200).json({
      message: "message updated successfully.",
      data: message,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update message.",
      details: (error as Error).message,
    });
  }
});

const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    await logApiCall(req);

    const currentUserId = getCurrentUserId(req);
    const { messageId, portalId } = req.body;

    if (!currentUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!messageId || !portalId) {
      return res.status(400).json({ error: "messageId and portalId are required" });
    }

    const deleted = await messagesService.deleteMessage({
      messageId,
      senderId: currentUserId,
      portalId,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Message not found" });
    }

    return res.status(200).json({
      message: "message deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete message.",
      details: (error as Error).message,
    });
  }
});

export default {
  getMessages,
  createMessage,
  updateMessage,
  deleteMessage,
};
