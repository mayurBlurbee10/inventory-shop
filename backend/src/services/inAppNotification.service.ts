import "reflect-metadata";
import { EntityTarget, ObjectLiteral, Between } from "typeorm";
import { connectDatabase, getConnection } from "../config/db.ts";
import { NotificationStatus, NotificationType } from "../config/constants.ts";
import { Messages } from "../entities/Messages.ts";
import { Tasks } from "../entities/Tasks.ts";
import { InAppNotifications } from "../entities/InAppNotifications.ts";

const getRepository = async (entity: EntityTarget<ObjectLiteral>) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

interface CreateNotificationData {
  userId: string;
  portalId?: string;
  title: string;
  body: string;
  url?: string;
  type?: NotificationType;
  referenceId?: string;
  preferenceKey?: string;
}

const truncateText = (value: string, maxLength = 500) => {
  if (!value) return "";
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
};

const createNotification = async (data: CreateNotificationData) => {
  const notificationRepository = await getRepository(InAppNotifications);
  try {
    const notification = notificationRepository.create({
      user: { id: String(data.userId) },
      portal: data.portalId ? { id: data.portalId } : undefined,
      title: truncateText(data.title, 255),
      body: truncateText(data.body, 500),
      url: data.url,
      type: data.type || NotificationType.SYSTEM,
      status: NotificationStatus.UNREAD,
      referenceId: data.referenceId,
    });

    await notificationRepository.save(notification);
    return notification;
  } catch (error) {
    throw new Error(
      `Failed to create notification: ${(error as Error).message}`,
    );
  }
};

const getUserNotifications = async (
  userId: string,
  portalId?: string,
  limit: number = 50,
  offset: number = 0,
) => {
  const notificationRepository = await getRepository(InAppNotifications);
  const messageRepository = await getRepository(Messages);
  const taskRepository = await getRepository(Tasks);

  try {
    const notifications = await notificationRepository.find({
      where: { user: { id: userId } },
      relations: ["user", "portal"],
      order: {
        createdAt: "DESC",
      },
      take: limit,
      skip: offset,
    });

    // Fetch reference data for each notification
    const notificationsWithReferenceData = await Promise.all(
      notifications.map(async (notification) => {
        let referenceData = null;

        if (notification.referenceId && notification.type) {
          try {
            switch (notification.type) {
              case NotificationType.MESSAGE:
                referenceData = await messageRepository.findOne({
                  where: { id: notification.referenceId },
                  relations: ["sender"],
                });
                break;

              case NotificationType.TASK:
                referenceData = await taskRepository.findOne({
                  where: { id: notification.referenceId },
                  relations: ["user", "createdBy"],
                });
                break;

              default:
                break;
            }
          } catch (error) {
            console.error(
              `Failed to fetch reference data for notification ${notification.id}:`,
              error,
            );
          }
        }

        return {
          ...notification,
          referenceData,
        };
      }),
    );

    return notificationsWithReferenceData;
  } catch (error) {
    throw new Error(
      `Failed to get user notifications: ${(error as Error).message}`,
    );
  }
};

const getUnreadNotificationCount = async (
  userId: string,
  portalId?: string,
) => {
  const notificationRepository = await getRepository(InAppNotifications);

  try {
    const count = await notificationRepository.count({
      where: {
        user: { id: userId },
        status: NotificationStatus.UNREAD,
      },
    });

    return count;
  } catch (error) {
    throw new Error(
      `Failed to get unread notification count: ${(error as Error).message}`,
    );
  }
};

const markNotificationAsRead = async (
  notificationId: string,
  userId: string,
) => {
  const notificationRepository = await getRepository(InAppNotifications);
  const messageRepository = await getRepository(Messages);

  try {
    const notification = await notificationRepository.findOne({
      where: {
        id: notificationId,
        user: { id: userId },
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    // Mark notification as read
    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    await notificationRepository.save(notification);

    // If it's a message notification, mark the related message as seen
    if (
      notification.type === NotificationType.MESSAGE &&
      notification.referenceId
    ) {
      try {
        let messageId = null;

        // Extract message ID from referenceData
        if (typeof notification.referenceId === "string") {
          const refData = notification.referenceId;
          console.log("ReferenceId=======================>", refData);

          messageId = refData;
        } else if (typeof notification.referenceData === "object") {
          messageId =
            notification.referenceData.messageId ||
            notification.referenceData.id;
        }

        if (messageId) {
          await messageRepository
            .createQueryBuilder()
            .update(Messages)
            .set({ seen: 1 })
            .where("id = :messageId", { messageId })
            .andWhere("receiver.id = :userId", { userId }) // Only mark as seen for the receiver
            .execute();
        }
      } catch (messageError) {
        console.error("Failed to mark related message as seen:", messageError);
        // Don't fail the notification update if message update fails
      }
    }

    return notification;
  } catch (error) {
    throw new Error(
      `Failed to mark notification as read: ${(error as Error).message}`,
    );
  }
};

const markNotificationAsReadOnMessageRead = async (
  messageId: string,
  userId: string,
) => {
  const notificationRepository = await getRepository(InAppNotifications);

  try {
    const notification = await notificationRepository.findOne({
      where: {
        referenceId: messageId, // If you have this field
        type: NotificationType.MESSAGE,
        user: { id: userId },
        status: NotificationStatus.UNREAD,
      },
    });

    if (!notification) {
      return null; // No notification found - this is normal
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    await notificationRepository.save(notification);
    return notification;
  } catch (error) {
    throw new Error(
      `Failed to mark notification as read: ${(error as Error).message}`,
    );
  }
};

const markAllNotificationsAsRead = async (
  userId: string,
  portalId?: string,
) => {
  const notificationRepository = await getRepository(InAppNotifications);
  const messageRepository = await getRepository(Messages);

  try {
    // Build condition to find unread notifications
    const whereCondition: any = {
      user: { id: userId },
      status: NotificationStatus.UNREAD,
    };

    if (portalId) {
      whereCondition.portal = { id: portalId };
    }

    // Fetch all unread notifications
    const unreadNotifications = await notificationRepository.find({
      where: whereCondition,
    });

    if (unreadNotifications.length === 0) {
      return { notificationsUpdated: 0, messagesUpdated: 0 };
    }

    // Update all notifications as read
    await notificationRepository.update(whereCondition, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });

    // Extract related message IDs
    const messageIds: string[] = [];

    for (const notification of unreadNotifications) {
      if (notification.type === NotificationType.MESSAGE) {
        try {
          let messageId: string | null = null;

          // Try extracting from referenceData
          if (notification.referenceData) {
            let refData = notification.referenceData;

            if (typeof refData === "string") {
              refData = JSON.parse(refData);
            }

            messageId = refData?.messageId || refData?.id || null;
          }

          // Fallback to referenceId if needed
          if (!messageId && typeof notification.referenceId === "string") {
            messageId = notification.referenceId;
          }

          if (messageId && !messageIds.includes(messageId)) {
            messageIds.push(messageId);
          }
        } catch (err) {
          console.error(
            `Failed to parse referenceData for notification ${notification.id}:`,
            err,
          );
        }
      }
    }

    // Ensure messageIds are valid
    const validMessageIds = messageIds.filter(
      (id) => typeof id === "string" && id.trim().length > 0,
    );
    console.log("Valid message IDs to update=====", validMessageIds);

    let messagesUpdated = 0;

    if (validMessageIds.length > 0) {
      try {
        const updateResult = await messageRepository
          .createQueryBuilder()
          .update(Messages)
          .set({ seen: true }) // correct type: boolean, not number
          .where("id IN (:...messageIds)", { messageIds: validMessageIds })
          .andWhere("receiver = :userId", { userId })
          .andWhere("seen = :seen", { seen: false })
          .execute();

        console.log("updateResult======", updateResult);

        messagesUpdated = updateResult.affected || 0;
      } catch (err) {
        console.error("Failed to mark messages as seen:", err);
      }
    }

    return {
      notificationsUpdated: unreadNotifications.length,
      messagesUpdated,
    };
  } catch (error) {
    throw new Error(
      `Failed to mark all notifications as read: ${(error as Error).message}`,
    );
  }
};

const deleteNotification = async (notificationId: string, userId: string) => {
  const notificationRepository = await getRepository(InAppNotifications);

  try {
    const notification = await notificationRepository.findOne({
      where: {
        id: notificationId,
        user: { id: userId },
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    await notificationRepository.remove(notification);
    return true;
  } catch (error) {
    throw new Error(
      `Failed to delete notification: ${(error as Error).message}`,
    );
  }
};

const getNotificationsByDateRange = async (
  userId: string,
  portalId: string,
  startDate: Date,
  endDate: Date,
) => {
  const notificationRepository = await getRepository(InAppNotifications);

  try {
    const whereCondition: any = {
      user: { id: userId },
      createdAt: Between(startDate, endDate),
    };

    if (portalId) {
      whereCondition.portal = { id: portalId };
    }

    const notifications = await notificationRepository.find({
      where: whereCondition,
      relations: ["user", "portal"],
      order: {
        createdAt: "DESC",
      },
    });

    return notifications;
  } catch (error) {
    throw new Error(
      `Failed to get notifications by date range: ${(error as Error).message}`,
    );
  }
};

const clearAllNotifications = async (userId: string) => {
  const notificationRepository = await getRepository(InAppNotifications);

  try {
    await notificationRepository.delete({
      user: { id: userId },
    });
  } catch (error) {
    throw new Error(
      `Failed to clear notifications: ${(error as Error).message}`,
    );
  }
};

const deleteAllNotifications = async (portalId: string) => {
  const notificationRepository = await getRepository(InAppNotifications);

  try {
    await notificationRepository.delete({
      portal: { id: portalId },
    });
  } catch (error) {
    throw new Error(
      `Failed to delete notifications: ${(error as Error).message}`,
    );
  }
};

export default {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationsByDateRange,
  markNotificationAsReadOnMessageRead,
  clearAllNotifications,
  deleteAllNotifications,
};
