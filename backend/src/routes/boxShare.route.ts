import express from "express";
import boxShareController from "../controllers/boxShare.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", authMiddleware.verifyUserAccess, boxShareController.getSharedFile);

export default router;

