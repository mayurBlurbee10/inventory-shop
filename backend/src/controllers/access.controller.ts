import type { Request, Response } from "express";
import { asyncHandler } from "../utils/helper.ts";
import { collectRoles, getRolePermissions } from "../utils/accesscontrol.ts";

const getPermissions = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const roles = collectRoles(user);
  const attributes = user?.attributeValues || user?.attributes || {};
  const result = await getRolePermissions({ roles, attributes });
  return res.status(200).json({
    roles: result.roles?.length ? result.roles : roles,
    permissions: result.permissions || {},
    meta: result.meta,
  });
});

export default { getPermissions };
