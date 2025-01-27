import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Users } from "@/entities/Users";
import * as bcrypt from "bcrypt";
import { validateOrReject } from "class-validator";
import { In } from "typeorm";


const getRepository = async (entity) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createUser = async (data) => {
  const userRepository = await getRepository(Users);
  try {
    const user = userRepository.create(data);
    // Validate user data according to the role-specific rules
    console.log("user", user);
    const valid = await validateOrReject(user);
    console.log("valid", valid);
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

const getUsersByPortal = async (portal) => {
  const userRepository = await getRepository(Users);
  try {
    return await userRepository.find({
      where: {
        portalId: portal,
      },
    });
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const getUserByEmail = async (email, portalId) => {
  const userRepository = await getRepository(Users);
  try {
    const query = { email };
    if (portalId) {
      query.portalId = portalId;
    }
    return await userRepository.findOneBy(query);
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const getUserByRole = async (role, userId) => {
  const userRepository = await getRepository(Users);

  if (!role && !userId) {
    throw new Error("Either role or userId must be provided.");
  }

  try {
    if (userId) {
      const user = await getUserById(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found.`);
      }
      if (
        !Array.isArray(user.groupMembersIds) ||
        user.groupMembersIds.length === 0
      ) {
        return [];
      }
      const users = await userRepository.findBy({
        id: In(user.groupMembersIds),
      });

      return users;
    } else {
      const users = await userRepository.find({
        where: { role },
      });
      return users;
    }
  } catch (error) {
    console.error("Error in getUserByRole:", error.message);
    throw new Error("Failed to get users. Please try again.");
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

const getUserByResetPasswordToken = async (token) => {
  const userRepository = await getRepository(Users);
  try {
    return await userRepository.findOneBy({ resetPasswordToken: token });
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const setPasswordByResetPasswordToken = async (token, newPassword) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }
  
    if(newPassword!="") {
      // Hash and set the new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    } else {
      user.password = null;
    }
  
    // Invalidate token after reset
    user.resetPasswordToken = null;

    await userRepository.save(user);
    return "Password successfully set";
  } catch (error) {
    console.log("error ==> ", error);
    throw new Error("Failed to set password.");
  }
};

const setUserAccessToken = async (email, token, authStrategy) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOne({
      where: {
        email,
      },
    });
    user.accessToken = token;
    if(!!authStrategy){
      user.authStrategy = authStrategy;
    }
    await userRepository.save(user);
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const setUserOnboarding = async (id) => {
  const userRepository = await getRepository(Users);
  const user = await userRepository.findOne({
    where: {
      id,
    },
  });
  user.isOnboardingRequired = false;
  await userRepository.save(user);
  return user;
};

const deleteUser = async (userId) => {
  const userRepository = await getRepository(Users);
  try {
    const userExist = await userRepository.findOneBy({ id: userId });
    if (!userExist) {
      throw new Error("user not exist");
    }
    await userRepository.delete({ id: userId });
    return "User deleted successfully.";
  } catch (error) {
    throw new Error(`Failed to delete user. ${error.message}`);
  }
};

const getUserById = async (id) => {
  const userRepository = await getRepository(Users);
  try {
    return await userRepository.findOneBy({id});
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const updateUser = async (id, updatedData) => {
  const userRepository = await getRepository(Users);
  try {
    const mainUser = await getUserById(id);
    Object.assign(mainUser, updatedData);
    await userRepository.save(mainUser);
    console.log("User updated successfully!");
  } catch (error) {
    console.error("Error updating user:", error.message);
    throw error;
  }
};

export default {
  createUser,
  getUsers,
  getUserByEmail,
  getUserByBoxUserId,
  addCollaboratorId,
  getUserByResetPasswordToken,
  setPasswordByResetPasswordToken,
  setUserAccessToken,
  getUsersByPortal,
  setUserOnboarding,
  deleteUser,
  getUserByRole,
  getUserById,
  updateUser,
};
