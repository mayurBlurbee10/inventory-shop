import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Users } from "../entities/Users.ts";
import * as bcrypt from "bcrypt";
import { validateOrReject } from "class-validator";
import { In } from "typeorm";
import { UserRole } from "../config/constants.ts";

import portalService from "./portal.service.ts";
import userPortalService from "./user.portal.service.ts";

const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createUser = async (data: any) => {
  const userRepository = await getRepository(Users);
  try {
    // Remove non-entity fields (portal may not exist yet during portal-setup bulk)
    const { portalName, portal, skipUserPortalSync, ...userData } = data;

    console.log(
      "createUser - portalName:",
      portalName,
      "portal:",
      portal,
      "userData.portalId:",
      userData.portalId,
      "skipUserPortalSync:",
      !!skipUserPortalSync,
    );

    // If portalId is an object, use portalName instead
    if (
      userData.portalId &&
      typeof userData.portalId === "object" &&
      portalName
    ) {
      userData.portalId = portalName;
    }

    const user = userRepository.create(userData);
    const savedUser = await userRepository.save(user);
    const userId = (savedUser as any).id;

    if (
      !skipUserPortalSync &&
      Array.isArray(userData.permissions) &&
      userData.permissions.length > 0
    ) {
      for (const permission of userData.permissions) {
        await userPortalService.syncFromPermissionEntry(userId, permission);
      }
    }

    return savedUser;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in createUser:", error);
    throw new Error(`Failed to create user. ${message}`);
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

const filterRole = async (userId: string, portalId: string) => {
  return userPortalService.getPortalRole(userId, portalId);
};

const filterAdvisor = (user: any, portalId: string) => {
  const permission = user?.permissions?.find(
    (item: any) => item?.portalId === portalId,
  );
  return permission?.advisorId || null;
};

const getUsersByPortal = async (portalId: string) => {
  return userPortalService.getPortalUsers(portalId);
};

const getUserByEmail = async (email: string, portalId?: string | null) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOneBy({ email });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting user by email:", (error as Error).message);
    throw new Error(`Failed to get user.`);
  }
};

const getPortalCreateAdminByEmail = async (email: string) => {
  try {
    const user = await getUserByEmail(email);
    if (user) {
      const portal = await portalService.getPortalByPortalAdmin((user as any).id);
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
    console.error("Error getting portalCreatedAdmin:", (error as Error).message);
    throw new Error((error as Error).message);
  }
};

const getUserByRole = async (role?: string, userId?: string) => {
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
    } else if (role) {
      return await userPortalService.getPortalUsersByRole(role);
    }
    return [];
  } catch (error) {
    console.error("Error in getUserByRole:", (error as Error).message);
    throw new Error("Failed to get users. Please try again.");
  }
};

const getUserByBoxUserId = async (boxUserId: string) => {
  const userRepository = await getRepository(Users);
  try {
    return await userRepository.findOneBy({ boxUserId });
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const getUserByBoxLeadId = async (leadId: string) => {
  const userRepository = await getRepository(Users);
  try {
    return await userRepository.findOneBy({ leadId });
  } catch (error) {
    throw new Error("Failed to get user by lead Id.");
  }
};

const addCollaboratorId = async (userId: string, collaboratorIds: any[]) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) throw new Error("User not found");
    user.collaborationIds = collaboratorIds;
    return await userRepository.save(user);
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const getUserByResetPasswordToken = async (token: string) => {
  const userRepository = await getRepository(Users);
  try {
    return await userRepository.findOneBy({ resetPasswordToken: token });
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const setPasswordByResetPasswordToken = async (
  token: string,
  newPassword: string,
) => {
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
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    } else {
      user.password = null;
    }
    user.resetPasswordToken = null;
    await userRepository.save(user);
    return "Password successfully set";
  } catch (error) {
    console.log("error ==> ", error);
    throw new Error("Failed to set password.");
  }
};

const setUserAccessToken = async (
  email: string,
  token: string,
  authStrategy?: string,
) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOne({
      where: {
        email,
      },
    });
    if (!user) throw new Error("User not found");
    user.accessToken = token;
    if (!!authStrategy) {
      user.authStrategy = authStrategy;
    }
    await userRepository.save(user);
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const setUserOnboarding = async (id: string) => {
  const userRepository = await getRepository(Users);
  const user = await userRepository.findOne({
    where: {
      id,
    },
  });
  if (!user) throw new Error("User not found");
  user.isOnboardingRequired = false;
  await userRepository.save(user);
  return user;
};

const deleteUser = async (userId: string) => {
  const userRepository = await getRepository(Users);
  try {
    const userExist = await userRepository.findOneBy({ id: userId });
    if (!userExist) {
      throw new Error("user not exist");
    }
    await userPortalService.deleteAllUserPortalsByUser(userId);
    await userRepository.delete({ id: userId });
    return "User deleted successfully.";
  } catch (error) {
    throw new Error(`Failed to delete user. ${(error as Error).message}`);
  }
};

const setResetPasswordToken = async (email: string, token: string) => {
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
    console.log("error ==> ", error);
    throw new Error("Failed to set ResetPasswordToken.");
  }
};

const getUserById = async (id: string) => {
  const userRepository = await getRepository(Users);
  try {
    return await userRepository.findOneBy({ id });
  } catch (error) {
    throw new Error("Failed to get users.");
  }
};

const updateUser = async (id: string, updatedData: any) => {
  const userRepository = await getRepository(Users);
  try {
    const mainUser = await getUserById(id);
    if (!mainUser) {
      throw new Error("User not found");
    }
    Object.assign(mainUser, updatedData);
    await userRepository.save(mainUser);
    console.log("User updated successfully!");
    return mainUser;
  } catch (error) {
    console.error("Error updating user:", (error as Error).message);
    throw error;
  }
};

const updateUserByLeadId = async (leadId: string, updatedData: any) => {
  const userRepository = await getRepository(Users);

  const user = await userRepository.findOne({
    where: { leadId },
  });

  if (!user) throw new Error("User not found");

  Object.assign(user, updatedData);
  await userRepository.save(user);

  return user;
};

const saveSignRequest = async (userId: string, signRequest: any) => {
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
    console.error("Error saving sign request:", (error as Error).message);
    throw error;
  }
};

const updateUserAccessCode = async (
  userId: string,
  portalId: string | null | undefined,
  encryptedAccessCode: string,
  expirationTime: Date,
) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    // Store access code in extra field as JSON
    let extraData: any = {};
    if (user.extra) {
      try {
        extraData =
          typeof user.extra === "string" ? JSON.parse(user.extra) : user.extra;
      } catch (e) {
        extraData = {};
      }
    }

    // Store access codes per portal
    if (!extraData.accessCodes) {
      extraData.accessCodes = {};
    }

    const portalKey = portalId || "root";
    extraData.accessCodes[portalKey] = {
      code: encryptedAccessCode,
      expirationTime: expirationTime.toISOString(),
    };

    user.extra = JSON.stringify(extraData);
    await userRepository.save(user);
    return user;
  } catch (error) {
    console.error("Error updating user access code:", (error as Error).message);
    throw new Error("Failed to update user access code");
  }
};

const getPortalUsersByRole = async (role: string) => {
  return await getUserByRole(role, "");
};

const setUserTokens = async (
  email: string,
  accessToken: string,
  refreshToken: string | null,
  authStrategy: any,
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

const getUserByRefreshToken = async (refreshToken: string) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOne({
      where: {
        refreshToken: refreshToken,
      },
      relations: ["organization"],
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error in getUserByRefreshToken:", error);
    throw new Error("Failed to get user by refresh token.");
  }
}; 

const getUsersByPortalForHub = async (portalId: string) => {
  return await getUsersByPortal(portalId);
};

const getUserPortalPermission = async (
  portalSlug: string | null,
  userId: string,
) => userPortalService.getUserPortal(portalSlug, userId);

export default {
  createUser,
  getUsers,
  getUserByEmail,
  getPortalCreateAdminByEmail,
  getUserByBoxUserId,
  getUserByBoxLeadId,
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
  updateUserAccessCode,
  updateUserByLeadId,
  setUserTokens,
  getUserByRefreshToken,
  getUsersByPortalForHub,
  getUserPortalPermission,
  filterRole,
  filterAdvisor,
};
