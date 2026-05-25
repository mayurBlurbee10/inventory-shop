import express from "express";
import boxEditorController from "../controllers/boxEditor.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", authMiddleware.verifyUserAccess, boxEditorController.getEditorLink);
router.post("/", authMiddleware.verifyUserAccess, boxEditorController.saveEditorFile);

export default router;

