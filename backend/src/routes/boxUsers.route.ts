import express from "express";
import boxUsersController from "../controllers/boxUsers.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", authMiddleware.verifyUserAccess, boxUsersController.getUsers);
router.post("/create", authMiddleware.verifyUserAccess, boxUsersController.createBoxUser);

export default router;

