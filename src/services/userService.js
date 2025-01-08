import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Users } from "@/entities/Users";
import * as bcrypt from "bcrypt";
import { validateOrReject } from "class-validator";

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
    console.log('user', user)
    const valid = await validateOrReject(user);
    console.log('valid', valid)
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
        portalId: portal
      },
    });
  } catch (error) {
    throw new Error("Failed to get users.");
  }
}

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
        resetPasswordToken: token
      },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }
  
    // Hash and set the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
  
    // Invalidate token after reset
    user.resetPasswordToken = null;
  
    await userRepository.save(user);
    return "Password successfully set";
  } catch (error) {
    console.log("error ==> ", error);
    throw new Error("Failed to set password.");
  }
};

const setUserAccessToken = async (email, token) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOne({
      where: {
        email
      },
    });
    user.accessToken = token;
    await userRepository.save(user);
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const setUserOnboarding = async(id) => {
  const userRepository = await getRepository(Users);
  const user = await userRepository.findOne({
    where: {
      id
    },
  });
  user.isOnboardingRequired = false;
  await userRepository.save(user);
  return user;
}

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
  setUserOnboarding
};
