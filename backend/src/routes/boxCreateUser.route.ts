import express from "express";
import multer from "multer";
import boxCreateUserController from "../controllers/boxCreateUser.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", authMiddleware.verifyUserAccess, boxCreateUserController.createBoxAppUser as any);
router.post("/bulk", upload.single("file") as any, authMiddleware.verifyUserAccess, boxCreateUserController.bulkCreateBoxUsers as any);

export default router;

