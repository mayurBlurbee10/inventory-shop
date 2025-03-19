import "reflect-metadata";
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
    console.error("Error getting messages:", error.message);
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
    throw new Error("Failed to create message.");
  }
};

export default {
  getMessages,
  createMessage,
};
