import { Router } from "express";
import { requireAuth } from "../middleware/require-auth.middleware.js";
import { getPermissions } from "../controllers/access.controller.js";

export const accessRoutes = Router();

accessRoutes.get("/permissions", requireAuth, getPermissions);
