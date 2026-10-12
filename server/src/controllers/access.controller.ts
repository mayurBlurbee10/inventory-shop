import type { Request, Response, NextFunction } from "express";
import { getSeparatedPermissions } from "../lib/accesscontrol.js";
import { accessAttributes } from "../middleware/access-control.middleware.js";

/** GET /api/access/permissions — the user's roles and { "resource.action": true } map for UI gating. */
export async function getPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const user = req.session.user;
        const result = await getSeparatedPermissions({
            email: user.email,
            attributes: await accessAttributes(req),
        });
        res.status(200).json({
            roles: result.roles || [],
            permissions: result.permissions || {},
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
}
