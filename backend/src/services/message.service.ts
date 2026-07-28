import "reflect-metadata";
import { IsNull } from "typeorm";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Messages } from "../entities/Messages.ts";
import { Users } from "../entities/Users.ts";
import { NotificationConfigure, NotificationType } from "../config/constants.ts";
import inAppNotificationService from "./inAppNotification.service.ts";
import notificationService from "./notification.service.ts";
import portalService from "./portal.service.ts";
import { decryptMessage } from "../utils/crypto.ts";

const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const getFullName = (user: any) =>
  `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
  user?.email ||
  "Someone";

const normalizeUserId = (value: any): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "object") return value.id ? String(value.id) : undefined;
  return String(value);
};

/** Plain text or decrypted ciphertext for notification preview. */
const getMessageNotificationBody = (message: any): string => {
  const rawText = message.text?.trim();
  if (rawText) {
    try {
      const decrypted = decryptMessage(rawText);
      const preview = (decrypted || rawText).trim();
      if (preview) return preview;
    } catch {
      return rawText;
    }
  }

  const subject = message.subject?.trim();
  if (subject) return subject;

  return "You have a new message";
};

const getMessages = async (
  senderId: string,
  receiverId: string,
  portalId: string,
) => {
  const messageRepository = await getRepository(Messages);
  try {
    const messages = await messageRepository.find({
      where: [
        { portalId: portalId, sender: { id: senderId }, receiver: { id: receiverId } },
        { portalId: portalId, sender: { id: receiverId }, receiver: { id: senderId } },
      ],
      relations: ["sender", "receiver"],
      order: { createdAt: "ASC" },
    });
    return messages;
  } catch (error) {
    throw error;
  }
};

const getUserMessages = async (senderId: string, portalId: string) => {
  const messageRepository = await getRepository(Messages);
  try {
    const messages = await messageRepository.find({
      where: [
        { portalId: portalId, sender: { id: senderId }, parentMessage: IsNull() },
        { portalId: portalId, receiver: { id: senderId }, parentMessage: IsNull() },
      ],
      relations: ["sender", "receiver", "replies", "replies.sender"],
      order: { createdAt: "ASC" },
    });
    return messages;
  } catch (error) {
    throw error;
  }
};

const createMessage = async (message: any) => {
  const messageRepository = await getRepository(Messages);
  try {
    const newMsg = messageRepository.create(message);
    await messageRepository.save(newMsg);

    // Notify receiver with in-app notification (don't fail message save if this fails)
    const receiverId = normalizeUserId(
      (newMsg as any).receiver ?? message.receiver,
    );
    const senderId = normalizeUserId(
      (newMsg as any).sender ?? message.sender,
    );
    const portalId = message.portalId || message.portal;

    if (receiverId && senderId && senderId !== receiverId) {
      try {
        const isEnabled = await notificationService.isNotificationEnabled(
          receiverId,
          NotificationConfigure.MESSAGE_IN_APP
        );

        if (!isEnabled) return newMsg;

        const userRepository = await getRepository(Users);
        const sender = await userRepository.findOne({
          where: { id: senderId },
        });
        const senderName = getFullName(sender);
        const notificationBody = getMessageNotificationBody({
          ...message,
          text: (newMsg as any).text ?? message.text,
          subject: (newMsg as any).subject ?? message.subject,
        });

        const notification = await inAppNotificationService.createNotification({
          userId: receiverId,
          portalId: await portalService.resolvePortalIdToUuid(portalId),
          title: `${senderName} sent you a message.`,
          body: notificationBody,
          type: NotificationType.MESSAGE,
          referenceId: (newMsg as any).id,
        });

        if (!notification) {
          console.warn("Message notification was not created for receiver:", receiverId);
        }
      } catch (notifErr) {
        console.error("Failed to create message notification:", notifErr);
      }
    }

    return newMsg;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const updateMessage = async (messageId: string, updatedData: any) => {
  const messageRepository = await getRepository(Messages);
  try {
    const message = await messageRepository.findOneBy({ id: messageId });
    if (!message) {
      throw new Error("Message not found");
    }
    Object.assign(message, updatedData);
    await messageRepository.save(message);
    return message;
  } catch (error) {
    throw error;
  }
};

const deleteMessage = async (messageId: string) => {
  const messageRepository = await getRepository(Messages);
  try {
    const message = await messageRepository.findOne({
      where: { id: messageId },
      relations: ["replies"],
    });

    if (!message) return;

    if (Array.isArray(message.replies) && message.replies.length > 0) {
      for (const reply of message.replies) {
        await deleteMessage(reply.id);
      }
    }

    await messageRepository.remove(message);
  } catch (error) {
    throw error;
  }
};

const deleteAllMessage = async (portalId: string) => {
  const messageRepository = await getRepository(Messages);
  try {
    await messageRepository.delete({ portalId: portalId });
    return;
  } catch (error) {
    throw error;
  }
};

export default {
  getMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  getUserMessages,
  deleteAllMessage,
};
