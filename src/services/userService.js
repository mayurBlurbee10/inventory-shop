import "reflect-metadata";
import { connectDatabase, getConnection } from "@/config/db";
import { Users } from "@/entities/Users";
import * as bcrypt from "bcrypt";
import { validateOrReject } from "class-validator";
import { In } from "typeorm";
import { UserRole } from "@/config/constants";
import portalService from "./portalService";

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
    const valid = await validateOrReject(user);
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

const getUsersByPortal = async (portalId) => {
  const userRepository = await getRepository(Users);
  try {
    const users = await userRepository.find();

    const filteredUsers = users.filter(
      (user) =>
        Array.isArray(user.permissions) &&
        user.permissions.some((permission) => permission.portalId === portalId),
    );

    return filteredUsers;
  } catch (error) {
    console.error("Error in getUsersByPortal:", error);
    throw new Error("Failed to get users: " + error.message);
  }
};

const getUserByEmail = async (email, portalId) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOneBy({ email });

    if (!user) {
      return null;
    }

    if (portalId) {
      const hasPermission =
        Array.isArray(user.permissions) &&
        user.permissions.some((perm) => perm.portalId === portalId);

      if (!hasPermission) {
        const hasSuperAdminPermission =
          Array.isArray(user.permissions) &&
          user.permissions.some((perm) => perm.role === UserRole.SUPER_ADMIN);
        if (hasSuperAdminPermission) {
          return user;
        }
      }
    }
    return user;
  } catch (error) {
    console.error("Error getting user by email:", error.message);
    throw new Error("Failed to get user.");
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

      // Fetch users matching the group member IDs
      const users = await userRepository.findBy({
        id: In(user.groupMembersIds),
      });

      return users;
    } else if (role) {
      // Fetch users based on role in permissions
      const users = await userRepository.find(); // Fetch all users
      const filteredUsers = users.filter(
        (user) =>
          Array.isArray(user.permissions) &&
          user.permissions.some((perm) => perm.role === role),
      );

      return filteredUsers;
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

    if (newPassword != "") {
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
    throw new Error("Failed to set password.");
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

const setResetPasswordToken = async (email, token) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOneBy({ email });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }
    user.resetPasswordToken = token;

    await userRepository.save(user);
    return "ResetPasswordToken successfully set";
  } catch (error) {
    throw new Error("Failed to set ResetPasswordToken.");
  }
};

const getUserById = async (id) => {
  const userRepository = await getRepository(Users);
  try {
    return await userRepository.findOneBy({ id });
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
    return mainUser;
  } catch (error) {
    console.error("Error updating user:", error.message);
    throw error;
  }
};

const saveSignRequest = async (userId, signRequest) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }
    if (user.signRequestsId && user.signRequestsId?.length > 0) {
      user.signRequestsId = [...user.signRequestsId, signRequest.id];
    } else {
      user.signRequestsId = [signRequest.id];
    }
    await userRepository.save(user);
  } catch (error) {
    console.error("Error saving sign request:", error.message);
    throw error;
  }
};

const removeSignRequest = async (user, uploadIdsFromSignTasks) => {
  if (
    !user?.id ||
    !Array.isArray(user.signRequestsId) ||
    !Array.isArray(uploadIdsFromSignTasks)
  ) {
    return;
  }

  const updatedSignIds = user.signRequestsId.filter(
    (id) => !uploadIdsFromSignTasks.includes(id),
  );

  await updateUser(user.id, {
    signRequestsId: updatedSignIds,
  });
  return;
};

const getPortalCreateAdminByEmail = async (email) => {
  try {
    const user = await getUserByEmail(email);
    if (user) {
      const portal = await portalService.getPortalByPortalAdmin(user?.id);
      if (portal) {
        throw new Error(
          `This user can't be the admin in this portal as it is already an admin in portal ${portal.legalName}`,
        );
      }
      return user;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting portalCreatedAdmin:", error.message);
    throw new Error(error.message);
  }
};

/**
 * Get user by refresh token
 * Used to validate refresh token during token refresh
 */
const getUserByRefreshToken = async (refreshToken) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOne({
      where: {
        refreshToken,
      },
    });
    return user;
  } catch (error) {
    throw new Error("Failed to get user by refresh token.");
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
    if (!user) {
      return;
    }
    user.accessToken = token;
    if (!!authStrategy) {
      user.authStrategy = authStrategy;
    }
    await userRepository.save(user);
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

/**
 * Set user access token and refresh token
 * Used during login and token refresh
 */
const setUserTokens = async (
  email,
  accessToken,
  refreshToken,
  authStrategy,
) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOne({
      where: {
        email,
      },
    });
    if (!user) {
      return;
    }
    user.accessToken = accessToken;
    if (refreshToken !== null) {
      user.refreshToken = refreshToken;
    }
    if (!!authStrategy) {
      user.authStrategy = authStrategy;
    }
    await userRepository.save(user);
  } catch (error) {
    throw new Error("Failed to set user tokens.");
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
  setResetPasswordToken,
  getUserById,
  updateUser,
  saveSignRequest,
  getPortalCreateAdminByEmail,
  removeSignRequest,
  getUserByRefreshToken,
  setUserTokens,
};
