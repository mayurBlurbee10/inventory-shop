import type { NextFunction, Request, Response } from "express";
import { checkAccess, collectRoles } from "../utils/accesscontrol.ts";

export function requireAccessControl(resourceKey: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const roles = collectRoles(user);
      const attributes = user?.attributeValues || user?.attributes || {};

      const { allowed, reason } = await checkAccess({
        roles,
        attributes,
        resource: resourceKey,
        action,
      });

      if (!allowed) {
        res.status(403).json({
          status: 403,
          code: "ACCESS_DENIED",
          message: "Forbidden",
          error: reason || "Access denied",
        });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export default { requireAccessControl };