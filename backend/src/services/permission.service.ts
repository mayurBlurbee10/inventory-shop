import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Users } from "../entities/Users.ts";
import userService from "./user.service.ts";
import userPortalService from "./user.portal.service.ts";

const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const syncUserPortalFromPermission = async (
  userId: string,
  permission: { portalId?: string | null; role: string },
) => {
  await userPortalService.syncFromPermissionEntry(userId, permission);
};

const upsertPortalPermissionEntry = (
  permissions: any[],
  permission: { portalId?: string | null; role: string },
) => {
  const next = Array.isArray(permissions) ? [...permissions] : [];
  const portalId = permission.portalId ?? null;
  const index = next.findIndex((entry) => entry.portalId === portalId);

  if (index >= 0) {
    next[index] = { ...next[index], role: permission.role };
  } else {
    next.push({ portalId, role: permission.role });
  }

  return next;
};

const removePermission = async (userId: string, portalId: string) => {
  const userRepository = await getRepository(Users);
  try {
    const userExist = await userRepository.findOneBy({ id: userId });
    if (!userExist) {
      throw new Error("user not exist");
    }

    const permissions = Array.isArray(userExist.permissions)
      ? userExist.permissions
      : [];

    const remainingPermissions = permissions.filter(
      (item: any) => item.portalId !== portalId,
    );

    await userPortalService.deleteUserPortal(portalId, userId);

    userExist.permissions = remainingPermissions;
    await userRepository.save(userExist);
    return "User removed from portal successfully.";
  } catch (error) {
    throw new Error(`Failed to remove user from portal. ${(error as Error).message}`);
  }
};

const updatePermission = async (
  id: string,
  updatedData: any,
  options?: { skipUserPortalSync?: boolean },
) => {
  const userRepository = await getRepository(Users);
  try {
    const mainUser = await userService.getUserById(id);
    if (!mainUser) {
      throw new Error("User not found");
    }

    if (updatedData.permissions) {
      const { permissions, role: _role, ...rest } = updatedData;

      mainUser.permissions = upsertPortalPermissionEntry(
        mainUser.permissions,
        permissions,
      );

      const {
        role: _restRole,
        permissions: _restPermissions,
        ...profileFields
      } = rest;

      if (Object.keys(profileFields).length > 0) {
        Object.assign(mainUser, profileFields);
      }

      await userRepository.save(mainUser);
      if (!options?.skipUserPortalSync) {
        await syncUserPortalFromPermission(id, permissions);
      }
      return mainUser;
    }

    const { role: _role, permissions: _permissions, ...profileOnly } =
      updatedData;
    Object.assign(mainUser, profileOnly);
    await userRepository.save(mainUser);
    return mainUser;
  } catch (error) {
    console.error("Error updating user permission:", (error as Error).message);
    throw error;
  }
};

export default {
  removePermission,
  updatePermission,
};
