import express from "express";
import boxMoveController from "../controllers/boxMove.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.post("/", authMiddleware.verifyUserAccess, boxMoveController.moveItem);

export default router;

