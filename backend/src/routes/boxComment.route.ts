import express from "express";
import boxCommentController from "../controllers/boxComment.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", authMiddleware.verifyUserAccess, boxCommentController.getComments);
router.post("/", authMiddleware.verifyUserAccess, boxCommentController.createComment);

export default router;

