import express from "express";
import themeController from "../controllers/theme.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", themeController.getTheme);
router.post("/", authMiddleware.verifyUserAccess, themeController.createTheme);

export default router;
