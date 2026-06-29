import "reflect-metadata";
import { IsNull } from "typeorm";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Messages } from "../entities/Messages.ts";
import { Portals } from "../entities/Portals.ts";
import { Users } from "../entities/Users.ts";
import { NotificationConfigure, NotificationType } from "../config/constants.ts";
import inAppNotificationService from "./inAppNotification.service.ts";
import notificationService from "./notification.service.ts";
import { reverseSanitizeName } from "../utils/commonUtils.ts";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

/** Resolve portal identifier (UUID, sanitized legalName, or legalName) to portal UUID for notifications. */
const resolvePortalIdToUuid = async (
  portalId: string | undefined,
): Promise<string | undefined> => {
  if (!portalId || typeof portalId !== "string" || !portalId.trim())
    return undefined;
  const trimmed = portalId.trim();
  if (UUID_REGEX.test(trimmed)) return trimmed;
  const portalRepository = await getRepository(Portals);
  const legalNameCandidates = Array.from(
    new Set([trimmed, reverseSanitizeName(trimmed)])
  );
  const portal = await portalRepository.findOne({
    where: legalNameCandidates.map((legalName) => ({ legalName })),
  });
  return portal?.id;
};

const getFullName = (user: any) =>
  `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
  user?.email ||
  "Someone";

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
    const receiverId =
      (newMsg as any).receiver?.id ?? message.receiver?.id ?? message.receiver;
    const senderId =
      (newMsg as any).sender?.id ?? message.sender?.id ?? message.sender;
    const portalId = message.portalId || message.portal;

    if (receiverId && senderId !== receiverId) {
      try {
        const isEnabled = await notificationService.isNotificationEnabled(
          receiverId,
          NotificationConfigure.MESSAGE_IN_APP
        );

        if (!isEnabled) return newMsg;

        const userRepository = await getRepository(Users);
        const sender = await userRepository.findOne({
          where: { id: typeof senderId === "object" ? senderId?.id : senderId },
        });
        const senderName = getFullName(sender);

        await inAppNotificationService.createNotification({
          userId: receiverId,
          portalId: await resolvePortalIdToUuid(portalId),
          title: `${senderName} sent you a message.`,
          body: message.text,
          type: NotificationType.MESSAGE,
          referenceId: (newMsg as any).id,
        });
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
