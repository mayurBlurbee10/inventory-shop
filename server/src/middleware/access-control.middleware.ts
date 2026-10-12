import type { NextFunction, Request, Response } from "express";
import { checkAccess, collectAttributes } from "../lib/accesscontrol.js";
import { findMembership, membershipAttributes } from "../services/membership.service.js";

type AccessPair = { resource: string; action: string };

/** Same attributes for route checks and the UI permission map, so both agree. */
export async function accessAttributes(req: Request): Promise<Record<string, unknown>> {
    const user = req.session?.user;
    // requireShop already loaded the membership; routes without it look it up here
    const member = req.member !== undefined ? req.member : user ? await findMembership(user.id) : null;
    return {
        ...collectAttributes(user),
        ...membershipAttributes(member),
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

async function enforce(req: Request, res: Response, next: NextFunction, pairs: AccessPair[]) {
    const user = req.session?.user;
    const { allowed, reason } = await checkAccess({
        email: user?.email,
        attributes: await accessAttributes(req),
        pairs,
    });
    if (!allowed) {
        deny(res, reason);
        return;
    }
    next();
}

/** Run after requireAuth. Denies with 403 ACCESS_DENIED unless resource.action is granted. */
export function requireAccessControl(resource: string, action: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await enforce(req, res, next, [{ resource, action }]);
        } catch (err) {
            next(err);
        }
    };
}

/**
 * For ABAC resource sets: the resolver loads the record and returns the pairs to check
 * (e.g. recent_sale.void). Returning null skips the check so the controller can answer 404.
 */
export function requireDynamicAccessControl(resolve: (req: Request) => Promise<AccessPair[] | null>) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const pairs = await resolve(req);
            if (!pairs || !pairs.length) {
                next();
                return;
            }
            await enforce(req, res, next, pairs);
        } catch (err) {
            next(err);
        }
    };
}
