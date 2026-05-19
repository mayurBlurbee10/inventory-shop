import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Users } from "../entities/Users.ts";
import * as bcrypt from "bcrypt";
import { validateOrReject } from "class-validator";
import { In } from "typeorm";
import { UserRole } from "../config/constants.ts";

import portalService from "./portal.service.ts";
import { reverseSanitizeName } from "../utils/commonUtils.ts";

const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const createUser = async (data: any) => {
  const userRepository = await getRepository(Users);
  try {
    // Remove portalName and portal from data as they're not entity fields
    const { portalName, portal, ...userData } = data;

    console.log(
      "createUser - portalName:",
      portalName,
      "portal:",
      portal,
      "userData.portalId:",
      userData.portalId,
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

    // Create user portal relation
    try {
      const userRole = userData.role || UserRole.USER;
      let portalId = null;

      // For SUPER_ADMIN, portal is null (they have access to all portals)
      // For other roles, get the portal by portalName
      if (userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.MASTER) {
        // Use portalName if available, otherwise try to use portalId (which might be a sanitized name)
        const portalSlug =
          portalName ||
          (userData.portalId && typeof userData.portalId === "string"
            ? userData.portalId
            : null);

        console.log(
          "Creating user portal relation - portalSlug:",
          portalSlug,
          "userRole:",
          userRole,
        );

        if (portalSlug) {
          try {
            // Try multiple variations to find the portal
            // 1. Try the original slug as-is (in case it's already the legal name)
            let portal = await portalService.getPortalByLegalName(portalSlug);

            // 2. If not found, try reverseSanitizeName (converts "qwerty" to "Qwerty")
            if (!portal) {
              const portalLegalName = reverseSanitizeName(portalSlug);
              console.log(
                "Looking up portal with legal name:",
                portalLegalName,
              );
              portal =
                await portalService.getPortalByLegalName(portalLegalName);
            }

            // 3. If still not found, try lowercase version
            if (!portal) {
              console.log(
                "Trying lowercase version:",
                portalSlug.toLowerCase(),
              );
              portal = await portalService.getPortalByLegalName(
                portalSlug.toLowerCase(),
              );
            }

            if (portal && portal.id) {
              portalId = portal.id;
              console.log(
                `Found portal with ID ${portalId} for portal slug: ${portalSlug}`,
              );
            } else {
              console.warn(
                `Portal not found for portal slug: ${portalSlug} (tried original, reversed, and lowercase)`,
              );
            }
          } catch (portalError) {
            console.error(
              "Error fetching portal for user portal relation:",
              portalError,
            );
            // Continue without portal relation if portal not found
          }
        } else {
          console.warn(
            "No portalName or portalId provided for user portal relation",
          );
        }
      }

      // Create user portal relation
      console.log("Creating user portal relation with:", {
        user: userId,
        portal: portalId,
        role: userRole,
      });
      // NOTE: userPortalService was removed.
      console.log(
        `User portal relation created for user ${userId} with role ${userRole} and portal ${portalId || "null"}`,
      );
    } catch (portalRelationError) {
      // Log error but don't fail user creation if portal relation creation fails
      console.error(
        "Error creating user portal relation:",
        portalRelationError,
      );

      // If it's not a duplicate error, we might want to handle it differently
      if (!(portalRelationError as Error).message.includes("already exists")) {
        console.warn(
          "User created but portal relation failed. User ID:",
          userId,
        );
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

const filterRole = (user: any, portalId: string) => {
  const permission = user?.permissions?.find(
    (item: any) => item?.portalId === portalId,
  );
  return permission?.role || null;
};

const filterAdvisor = (user: any, portalId: string) => {
  const permission = user?.permissions?.find(
    (item: any) => item?.portalId === portalId,
  );
  return permission?.advisorId || null;
};

const getUsersByPortal = async (portalId: string) => {
  const userRepository = await getRepository(Users);
  try {
    const users = await userRepository.find();

    const filteredUsers = users.filter(
      (user) =>
        Array.isArray(user.permissions) &&
        user.permissions.some((permission: any) => permission.portalId === portalId),
    );

    return filteredUsers;
  } catch (error) {
    console.error("Error in getUsersByPortal:", error);
    throw new Error("Failed to get users: " + (error as Error).message);
  }
};

const getUserByEmail = async (email: string, portalId?: string | null) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOneBy({ email });

    if (!user) {
      return null;
    }

    if (portalId) {
      const hasPermission =
        Array.isArray(user.permissions) &&
        user.permissions.some((perm: any) => perm.portalId === portalId);

      if (!hasPermission) {
        const hasSuperAdminPermission =
          Array.isArray(user.permissions) &&
          user.permissions.some((perm: any) => perm.role === UserRole.SUPER_ADMIN);
        if (hasSuperAdminPermission) {
          return user;
        }
      }
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
      const users = await userRepository.find();
      const filteredUsers = users.filter(
        (user) =>
          Array.isArray(user.permissions) &&
          user.permissions.some((perm: any) => perm.role === role),
      );
      return filteredUsers;
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
};export default {
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
};
