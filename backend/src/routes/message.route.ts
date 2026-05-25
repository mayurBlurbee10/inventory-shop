import express from "express";
import messageController from "../controllers/message.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", authMiddleware.verifyUserAccess, messageController.getMessages);
router.post("/", authMiddleware.verifyUserAccess, messageController.createMessage);
router.put("/", authMiddleware.verifyUserAccess, messageController.updateMessage);
router.delete("/", authMiddleware.verifyUserAccess, messageController.deleteMessage);

export default router;

