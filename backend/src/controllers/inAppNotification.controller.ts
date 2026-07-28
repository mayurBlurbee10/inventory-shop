import { Request, Response } from "express";
import { EntityTarget, ObjectLiteral } from "typeorm";
import { Users } from "../entities/Users.ts";
import { getConnection } from "../config/db.ts";
import { NotificationType } from "../config/constants.ts";
import inAppNotificationService from "../services/inAppNotification.service.ts";
import portalService from "../services/portal.service.ts";

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
  portalId?: string;
  type?: NotificationType;
  referenceId?: string; // ID of the related entity
}

// Helper function to extract portalId from request headers
const getPortalIdFromHeaders = async (req: Request): Promise<string | undefined> => {
  const portalId = req.headers["x-portal-id"];
  if (!portalId || typeof portalId !== "string") return undefined;
  return portalService.resolvePortalIdToUuid(portalId);
};

const getRepository = async (entity: EntityTarget<ObjectLiteral>) => {
  const connection = getConnection();
  return connection.getRepository(entity);
};

const addPushSubscription = async (req: Request, res: Response) => {
  try {
    const { userId, subscription } = req.body;
    const userRepo = await getRepository(Users);

    const user = await userRepo.findOneBy({ id: userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    user.pushSubscription = subscription;
    await userRepo.save(user);

    res.status(200).json({ message: "Subscribed" });
  } catch (error) {
    console.error("Error:", (error as Error).message);
    res.status(500).json({
      error: "Failed to add pushSubscription.",
      details: (error as Error).message,
    });
  }
};

const sendNotification = async (
  payload: NotificationPayload,
  req?: Request,
) => {
  const { userId, title, body, url, portalId, type, referenceId } = payload;

  // Try to get portalId from request headers if not provided in payload
  const finalPortalId =
    portalId || await (req ? getPortalIdFromHeaders(req) : undefined);

  const userRepo = await getRepository(Users);

  const user = await userRepo.findOneBy({ id: userId });
  if (!user) {
    console.warn(`Missing user record: ${userId}`);
    return;
  }

  // Always create notification in database first
  const notification = await inAppNotificationService.createNotification({
    userId,
    portalId: finalPortalId,
    title,
    body,
    url,
    type: type || NotificationType.SYSTEM,
    referenceId: referenceId,
  });

  if (!notification) {
    return;
  }

  if (!user?.pushSubscription) {
    console.warn(`No push subscription found for user: ${userId}`);
    return;
  }

  try {
    // await webPush.sendNotification(
    //   user.pushSubscription,
    //   JSON.stringify({ title, body, url })
    // );
    console.log(`Push sent to user ${userId}: ${title}`);
  } catch (err) {
    console.error(`Push Error for user ${userId}:`, err);
  }
};

// Send in-app notification to a user (e.g. when someone sends a message)
const sendNotificationToUser = async (req: Request, res: Response) => {
  try {
    const portalId = await getPortalIdFromHeaders(req);
    const senderId = req.user?.id as string;
    const { receiverId, title, body, url, type } = req.body;

    if (!receiverId || !title || !body) {
      res.status(400).json({
        error: "receiverId, title, and body are required",
      });
      return;
    }

    const notification = await inAppNotificationService.createNotification({
      userId: receiverId,
      portalId: portalId,
      title: String(title),
      body: String(body),
      url: url ? String(url) : undefined,
      type: type || NotificationType.MESSAGE,
    });

    if (!notification) {
      res.status(200).json({
        message: "Notification skipped by user preferences",
      });
      return;
    }

    res.status(201).json({
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      error: "Failed to send notification",
      details: (error as Error).message,
    });
  }
};

// Get user notifications for bell icon
const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const portalId = await getPortalIdFromHeaders(req);
    const userId = (req.user as any)?.id as string;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const notifications = await inAppNotificationService.getUserNotifications(
      userId,
      portalId,
      limit,
      offset,
    );

    res.status(200).json({
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).json({
      error: "Failed to retrieve notifications",
      details: (error as Error).message,
    });
  }
};

// Get unread notification count for bell icon badge
const getUnreadNotificationCount = async (req: Request, res: Response) => {
  try {
    const portalId = await getPortalIdFromHeaders(req);
    const userId = req.user?.id as string;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const count = await inAppNotificationService.getUnreadNotificationCount(
      userId,
      portalId as string,
    );

    res.status(200).json({
      message: "Unread notification count retrieved successfully",
      data: { count },
    });
  } catch (error) {
    console.error("Error retrieving unread notification count:", error);
    res.status(500).json({
      error: "Failed to retrieve unread notification count",
      details: (error as Error).message,
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id as string;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const notification = await inAppNotificationService.markNotificationAsRead(
      notificationId,
      userId,
    );

    res.status(200).json({
      message: "Notification marked as read successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      error: "Failed to mark notification as read",
      details: (error as Error).message,
    });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const portalId = await getPortalIdFromHeaders(req);
    const userId = req.user?.id as string;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    await inAppNotificationService.markAllNotificationsAsRead(userId, portalId);

    res.status(200).json({
      message: "All notifications marked as read successfully",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      error: "Failed to mark all notifications as read",
      details: (error as Error).message,
    });
  }
};

// Delete notification
const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id as string;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    await inAppNotificationService.deleteNotification(notificationId, userId);

    res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      error: "Failed to delete notification",
      details: (error as Error).message,
    });
  }
};

const clearAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    await inAppNotificationService.clearAllNotifications(userId);

    res.status(200).json({
      message: "All notifications cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({
      error: "Failed to clear notifications",
      details: (error as Error).message,
    });
  }
};

export default {
  addPushSubscription,
  sendNotification,
  sendNotificationToUser,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
};
