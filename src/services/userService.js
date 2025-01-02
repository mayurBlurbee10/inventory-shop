import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Users } from "@/entities/Users";

const getRepository = async (entity) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createUser = async (data) => {
  const userRepository = await getRepository(Users);
  try {
    const user = userRepository.create(data);
    await userRepository.save(user);
    return user;
  } catch (error) {
    throw new Error("Failed to create user.");
  }
};

const getUsers = async () => {
  const userRepository = await getRepository(Users);
  try {
    return await userRepository.find();
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const getUserByEmail = async (email) => {
  const userRepository = await getRepository(Users);
  try {
    return await userRepository.findOneBy({ email });
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const getUserByBoxUserId = async (boxUserId) => {
  const userRepository = await getRepository(Users);
  try {
    return await userRepository.findOneBy({ boxUserId });
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const addCollaboratorId = async (userId, collaboratorIds) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOneBy({ id: userId });
    user.collaborationIds = collaboratorIds;
    return await userRepository.save(user);
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

export default {
  createUser,
  getUsers,
  getUserByEmail,
  getUserByBoxUserId,
  addCollaboratorId,
};
