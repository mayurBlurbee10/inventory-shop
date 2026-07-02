import express from "express";
import messagesController from "../controllers/messages.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", authMiddleware.verifyUserAccess, messagesController.getMessages);
router.post("/", authMiddleware.verifyUserAccess, messagesController.createMessage);
router.put("/", authMiddleware.verifyUserAccess, messagesController.updateMessage);
router.delete("/", authMiddleware.verifyUserAccess, messagesController.deleteMessage);

export default router;
