import express from "express";
import pluginController from "../controllers/plugin.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", pluginController.getPlugins);
router.post("/", authMiddleware.verifyUserAccess, pluginController.createPlugin);
router.put("/", authMiddleware.verifyUserAccess, pluginController.updatePlugin);
router.delete("/", authMiddleware.verifyUserAccess, pluginController.deletePlugin);

export default router;

