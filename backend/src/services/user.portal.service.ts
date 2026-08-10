import "reflect-metadata";

import { EntityTarget, IsNull, ObjectLiteral } from "typeorm";

import { connectDatabase, getConnection } from "../config/db.ts";

import { UserPortals } from "../entities/UserPortals.ts";

import {
  UserRole,
  USER_PORTAL_ROLE_VALUES,
  isGlobalUserRole,
} from "../config/constants.ts";

import portalService from "./portal.service.ts";

import { reverseSanitizeName } from "../utils/commonUtils.ts";

const normalizeRole = (role?: string | null): string => {
  if (!role) return UserRole.USER;

  if ((USER_PORTAL_ROLE_VALUES as readonly string[]).includes(role)) {
    return role;
  }

  return UserRole.USER;
};

const getRepository = async (entity: EntityTarget<ObjectLiteral>) => {
  await connectDatabase();

  const connection = getConnection();

  return connection.getRepository(entity);
};

const resolvePortalBySlug = async (portalSlug?: string | null) => {
  if (!portalSlug || portalSlug === "admin" || portalSlug === "root") {
    return null;
  }

  let portal = await portalService.getPortalByLegalName(portalSlug);

  if (!portal) {
    portal = await portalService.getPortalByLegalName(
      reverseSanitizeName(portalSlug),
    );
  }

  if (!portal) {
    portal = await portalService.getPortalByLegalName(portalSlug.toLowerCase());
  }

  return portal;
};

const isGlobalPermission = (permission: {
  portalId?: string | null;

  role: string;
}) =>
  permission.portalId === null ||
  permission.portalId === undefined ||
  isGlobalUserRole(permission.role);

const createUserPortal = async (data: {
  user: string;

  portal?: string | null;

  portalSlug?: string | null;

  role: string;
}) => {
  const userPortalRepository = await getRepository(UserPortals);

  const userId = data.user;

  const role = normalizeRole(data.role);

  const useGlobalPortal = isGlobalUserRole(role);

  let portalEntity = null;

  if (!useGlobalPortal) {
    if (data.portal) {
      portalEntity = { id: data.portal };
    } else if (data.portalSlug) {
      portalEntity = await resolvePortalBySlug(data.portalSlug);
    }

    if (!portalEntity?.id) {
      throw new Error("Portal not found.");
    }
  }

  const portalId = portalEntity?.id ?? null;

  const existingUserPortal = await userPortalRepository.findOne({
    where: {
      user: { id: userId },

      portal: portalId ? { id: portalId } : IsNull(),
    },
  });

  if (existingUserPortal) {
    throw new Error("User portal relation already exists.");
  }

  const newUserPortal = userPortalRepository.create({
    user: { id: userId },

    portal: portalId ? { id: portalId } : null,

    role,
  });

  await userPortalRepository.save(newUserPortal);

  return newUserPortal;
};

const getPortalSpecificUserPortal = async (
  portalSlug: string,

  userId: string,
) => {
  if (!portalSlug || portalSlug === "root") {
    return null;
  }

  const userPortalRepository = await getRepository(UserPortals);

  const portal = await resolvePortalBySlug(portalSlug);

  if (!portal?.id) {
    return null;
  }

  return userPortalRepository.findOne({
    where: {
      user: { id: userId },

      portal: { id: portal.id },
    },

    relations: ["portal"],
  });
};

const getGlobalUserPortal = async (userId: string) => {
  const userPortalRepository = await getRepository(UserPortals);

  const globalRelations = await userPortalRepository.find({
    where: {
      user: { id: userId },

      portal: IsNull(),
    },
  });

  return (
    globalRelations.find((relation) => isGlobalUserRole(relation.role)) ?? null
  );
};

/** Auth read: portal-specific first, then global super_admin/master fallback. */

const getUserPortal = async (portalSlug: string | null, userId: string) => {
  if (portalSlug && portalSlug !== "root") {
    const portalRelation = await getPortalSpecificUserPortal(
      portalSlug,
      userId,
    );

    if (portalRelation) {
      return portalRelation;
    }
  }

  return getGlobalUserPortal(userId);
};

const getPortalUsers = async (portalSlug: string) => {
  const userPortalRepository = await getRepository(UserPortals);

  const portal = await resolvePortalBySlug(portalSlug);

  if (!portal?.id) {
    return [];
  }

  const userPortalRelations = await userPortalRepository.find({
    where: { portal: { id: portal.id } },

    relations: ["user", "portal"],
  });

  return userPortalRelations.map(({ user, role, lastLoginAt }) => ({
    ...user,

    role,

    lastLoginAt,
  }));
};

const getPortalUsersByRole = async (role: string) => {
  const userPortalRepository = await getRepository(UserPortals);

  const normalizedRole = normalizeRole(role);

  const userPortalRelations = await userPortalRepository.find({
    where: { role: normalizedRole },

    relations: ["user"],
  });

  return userPortalRelations.map((relation) => relation.user);
};

const updateUserPortal = async (
  portalSlug: string | null,

  userId: string,

  updateData: { role?: string; lastLoginAt?: Date },

  options?: { global?: boolean },
) => {
  const userPortalRepository = await getRepository(UserPortals);

  let userPortalRelation = null;

  if (options?.global || !portalSlug || portalSlug === "root") {
    userPortalRelation = await userPortalRepository.findOne({
      where: {
        user: { id: userId },

        portal: IsNull(),
      },
    });
  } else {
    const portal = await resolvePortalBySlug(portalSlug);

    if (!portal?.id) {
      throw new Error("Portal not found.");
    }

    userPortalRelation = await userPortalRepository.findOne({
      where: {
        user: { id: userId },

        portal: { id: portal.id },
      },
    });
  }

  if (!userPortalRelation) {
    throw new Error("User portal relation not found.");
  }

  if (updateData.role) {
    userPortalRelation.role = normalizeRole(updateData.role);
  }

  if (updateData.lastLoginAt) {
    userPortalRelation.lastLoginAt = updateData.lastLoginAt;
  }

  await userPortalRepository.save(userPortalRelation);

  return userPortalRelation;
};

const deleteUserPortal = async (portalSlug: string, userId: string) => {
  const userPortalRepository = await getRepository(UserPortals);

  if (!portalSlug || portalSlug === "root") {
    await userPortalRepository.delete({
      user: { id: userId },

      portal: IsNull(),
    });

    return "Global user portal relation removed.";
  }

  const portal = await resolvePortalBySlug(portalSlug);

  if (!portal?.id) {
    throw new Error("Portal not found.");
  }

  await userPortalRepository.delete({
    user: { id: userId },

    portal: { id: portal.id },
  });

  return "User removed from portal successfully";
};

const deleteAllUserPortalsByUser = async (userId: string) => {
  const userPortalRepository = await getRepository(UserPortals);

  await userPortalRepository.delete({ user: { id: userId } });
};

const getPortalRole = async (userId: string, portalSlug?: string | null) => {
  const relation = await getUserPortal(portalSlug ?? null, userId);

  return relation?.role ?? null;
};

/** Sync one permissions[] entry to exactly one user_portals row. */

const syncFromPermissionEntry = async (
  userId: string,

  permission: { portalId?: string | null; role: string },
) => {
  const role = normalizeRole(permission.role);

  if (isGlobalPermission(permission)) {
    const existingRelation = await getGlobalUserPortal(userId);

    if (existingRelation) {
      if (existingRelation.role !== role) {
        await updateUserPortal(null, userId, { role }, { global: true });
      }

      return;
    }

    await createUserPortal({ user: userId, portalSlug: null, role });

    return;
  }

  if (!permission.portalId) {
    throw new Error("portalId is required for portal-scoped roles.");
  }

  const existingRelation = await getPortalSpecificUserPortal(
    permission.portalId,

    userId,
  );

  if (existingRelation) {
    if (existingRelation.role !== role) {
      await updateUserPortal(permission.portalId, userId, { role });
    }

    return;
  }

  await createUserPortal({
    user: userId,

    portalSlug: permission.portalId,

    role,
  });
};

export default {
  createUserPortal,
  getUserPortal,
  getPortalSpecificUserPortal,
  getGlobalUserPortal,
  getPortalUsers,
  getPortalUsersByRole,
  updateUserPortal,
  deleteUserPortal,
  deleteAllUserPortalsByUser,
  getPortalRole,
  syncFromPermissionEntry,
};
