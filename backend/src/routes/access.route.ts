import express from "express";
import accessController from "../controllers/access.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get(
  "/permissions",
  authMiddleware.verifyUserAccess,
  accessController.getPermissions
);

export default router;