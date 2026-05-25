import express from "express";
import authController from "../controllers/auth.controller.ts";

const router = express.Router();

router.post("/login", authController.login);
router.post("/admin/login", authController.adminLogin);
router.post("/set-password", authController.setPassword);
router.post("/register", authController.register);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);

export default router;

