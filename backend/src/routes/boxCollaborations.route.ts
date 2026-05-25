import express from "express";
import boxCollaborationsController from "../controllers/boxCollaborations.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.post("/", authMiddleware.verifyUserAccess, boxCollaborationsController.getCollaborations);

export default router;

