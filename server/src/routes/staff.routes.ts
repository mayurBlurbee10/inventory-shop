import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { requireShop } from "../middleware/require-shop.middleware.js";
import { requireAccessControl } from "../middleware/access-control.middleware.js";
import { authLimiter } from "../middleware/rate-limiter.middleware.js";
import { ACTIONS, RESOURCES } from "../constants/access.js";
import {
    acceptInvitation,
    changeRole,
    getStaff,
    inviteStaff,
    lookupInvitation,
    removeMember,
    resendInvitation,
    revokeInvitation,
    updateAttributes,
} from "../controllers/staff.controller.js";

export const staffRoutes = Router();

// Public invitation endpoints (the emailed token is the proof)
staffRoutes.get("/invitations/lookup", authLimiter, lookupInvitation);
staffRoutes.post("/invitations/accept", authLimiter, acceptInvitation);

// Everything else: signed in, scoped to the active shop, and checked against the PAP policy
staffRoutes.use(requireAuth);
staffRoutes.use(requireShop);

staffRoutes.get("/", requireAccessControl(RESOURCES.STAFF, ACTIONS.VIEW), getStaff);
staffRoutes.post("/invitations", requireAccessControl(RESOURCES.STAFF, ACTIONS.INVITE), inviteStaff);
staffRoutes.post("/invitations/:id/resend", requireAccessControl(RESOURCES.STAFF, ACTIONS.INVITE), resendInvitation);
staffRoutes.delete("/invitations/:id", requireAccessControl(RESOURCES.STAFF, ACTIONS.INVITE), revokeInvitation);
staffRoutes.patch("/:id/role", requireAccessControl(RESOURCES.STAFF, ACTIONS.UPDATE_ROLE), changeRole);
staffRoutes.patch("/:id/attributes", requireAccessControl(RESOURCES.STAFF, ACTIONS.UPDATE_ROLE), updateAttributes);
staffRoutes.delete("/:id", requireAccessControl(RESOURCES.STAFF, ACTIONS.REMOVE), removeMember);
