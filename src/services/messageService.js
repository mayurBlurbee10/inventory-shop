import "reflect-metadata";
import { IsNull } from "typeorm";
import { connectDatabase, getConnection } from "@/config/db";
import { Messages } from "@/entities/Messages";

const getRepository = async (entity) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const getMessages = async (senderId, receiverId, portalId) => {
  const messageRepository = await getRepository(Messages);
  try {
    const messages = await messageRepository.find({
      where: [
        { portalId : portalId, sender: { id: senderId }, receiver: { id: receiverId } },
        { portalId : portalId, sender: { id: receiverId }, receiver: { id: senderId } },
      ],
      relations: ["sender", "receiver"],
      order: { createdAt: "ASC" },
    });

    return messages;
  } catch (error) {
    throw error;
  }
};

const getUserMessages = async (senderId, portalId) => {
  const messageRepository = await getRepository(Messages);
  try {
    const messages = await messageRepository.find({
      where: [
        { portalId : portalId, sender: { id: senderId }, parentMessage: IsNull()},
        { portalId : portalId, receiver: { id: senderId }, parentMessage: IsNull() },
      ],
      relations: ["sender", "receiver", "replies", "replies.sender"],
      order: { createdAt: "ASC" },
    });
    return messages;
  } catch (error) {
    throw error;
  }
};

const createMessage = async (message) => {
  const messageRepository = await getRepository(Messages);
  try {
    const newMsg = messageRepository.create(message);
    await messageRepository.save(newMsg);
    return newMsg;
  } catch (error) {
    throw new Error(error?.message);
  }
};

const updateMessage = async (messageId, updatedData) => {
  const messageRepository = await getRepository(Messages);
  try {
    const message = await messageRepository.findOneBy({ id: messageId });

    Object.assign(message, updatedData);
    await messageRepository.save(message);
    return message;
  } catch (error) {
    
    throw error;
  }
};

const deleteMessage = async (messageId) => {
  const messageRepository = await getRepository(Messages);
  try {
    const message = await messageRepository.findOneBy({ id: messageId });
    if (!message) {
      return;
    }
    await messageRepository.remove(message);
    return;
  } catch (error) {
    throw error;
  }
};

const deleteAllMessage = async (portalId) => {
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
  deleteAllMessage
};
