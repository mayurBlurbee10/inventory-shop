import "reflect-metadata";
import { IsNull } from "typeorm";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Messages } from "../entities/Messages.ts";

const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const getConversationMessages = async (
  userId: string,
  otherUserId: string,
  portalId: string,
) => {
  const messageRepository = await getRepository(Messages);

  return messageRepository.find({
    where: [
      {
        portalId,
        sender: { id: userId },
        receiver: { id: otherUserId },
      },
      {
        portalId,
        sender: { id: otherUserId },
        receiver: { id: userId },
      },
    ],
    relations: ["sender", "receiver"],
    order: { createdAt: "ASC" },
  });
};

const getUserMessages = async (userId: string, portalId: string) => {
  const messageRepository = await getRepository(Messages);

  return messageRepository.find({
    where: [
      {
        portalId,
        sender: { id: userId },
        parentMessage: IsNull(),
      },
      {
        portalId,
        receiver: { id: userId },
        parentMessage: IsNull(),
      },
    ],
    relations: ["sender", "receiver", "replies", "replies.sender"],
    order: { createdAt: "ASC" },
  });
};

const createMessage = async ({
  senderId,
  receiverId,
  portalId,
  text,
}: {
  senderId: string;
  receiverId: string;
  portalId: string;
  text: string;
}) => {
  const messageRepository = await getRepository(Messages);
  const message = messageRepository.create({
    sender: { id: senderId },
    receiver: { id: receiverId },
    portalId,
    text,
  });

  return messageRepository.save(message);
};

const updateMessage = async ({
  messageId,
  senderId,
  portalId,
  text,
}: {
  messageId: string;
  senderId: string;
  portalId: string;
  text: string;
}) => {
  const messageRepository = await getRepository(Messages);
  const message = await messageRepository.findOne({
    where: {
      id: messageId,
      portalId,
      sender: { id: senderId },
    },
    relations: ["sender", "receiver"],
  });

  if (!message) return null;

  message.text = text;
  return messageRepository.save(message);
};

const deleteMessage = async ({
  messageId,
  senderId,
  portalId,
}: {
  messageId: string;
  senderId: string;
  portalId: string;
}) => {
  const messageRepository = await getRepository(Messages);
  const message = await messageRepository.findOne({
    where: {
      id: messageId,
      portalId,
      sender: { id: senderId },
    },
    relations: ["replies"],
  });

  if (!message) return false;

  if (Array.isArray(message.replies) && message.replies.length > 0) {
    for (const reply of message.replies) {
      await deleteMessage({ messageId: reply.id, senderId, portalId });
    }
  }

  await messageRepository.remove(message);
  return true;
};

export default {
  getConversationMessages,
  getUserMessages,
  createMessage,
  updateMessage,
  deleteMessage,
};
