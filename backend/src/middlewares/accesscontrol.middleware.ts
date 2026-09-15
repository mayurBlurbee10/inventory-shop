import type { NextFunction, Request, Response } from "express";
import { accessTestAttributes } from "../controllers/access.controller.ts";
import {
  checkAccess,
  collectAttributes,
  getSeparatedPermissions,
} from "../utils/accesscontrol.ts";

function accessAttributes(user: any) {
  return {
    ...collectAttributes(user),
    ...accessTestAttributes,
    ...(user?.email ? { email: user.email } : {}),
  };
}

function deny(res: Response, reason: string) {
  res.status(403).json({
    status: 403,
    code: "ACCESS_DENIED",
    message: "Forbidden",
    error: reason || "Access denied",
  });
}

export function requireAccessControl(resourceKey: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { allowed, reason } = await checkAccess({
        email: user?.email,
        attributes: accessAttributes(user),
        resource: resourceKey,
        action,
      });

      if (!allowed) {
        deny(res, reason);
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Allow the request if any of the resource.action pairs is granted. */
export function requireAnyAccessControl(
  pairs: Array<{ resource: string; action: string }>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const result = await getSeparatedPermissions({
        email: user?.email,
        attributes: accessAttributes(user),
      });
      const allowed = pairs.some((p) =>
        Boolean(result.permissions?.[`${p.resource}.${p.action}`])
      );
      if (!allowed) {
        deny(
          res,
          `No grant for ${pairs.map((p) => `${p.resource}.${p.action}`).join(" | ")}`
        );
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export default { requireAccessControl, requireAnyAccessControl };
