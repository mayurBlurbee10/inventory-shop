import express from "express";
import authMiddleware from "../middlewares/auth.middleware.ts";
import inbuildPluginsController from "../controllers/inbuildPlugins.controller.ts";

const router = express.Router();

// CRUD operations for InbuildPlugins
router.get("/", authMiddleware.verifyUserAccess, inbuildPluginsController.getInbuildPlugins);
router.post("/", authMiddleware.verifyUserAccess, inbuildPluginsController.createInbuildPlugin);
router.get("/:id", authMiddleware.verifyUserAccess, inbuildPluginsController.getInbuildPluginById);
router.put("/:id", authMiddleware.verifyUserAccess, inbuildPluginsController.updateInbuildPlugin);
router.delete("/:id", authMiddleware.verifyUserAccess, inbuildPluginsController.deleteInbuildPlugin);

// Additional endpoints
router.patch("/:id/toggle-status", authMiddleware.verifyUserAccess, inbuildPluginsController.togglePluginStatus);

export default router;
