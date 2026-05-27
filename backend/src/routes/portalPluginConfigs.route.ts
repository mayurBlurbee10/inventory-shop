import express from "express";
import authMiddleware from "../middlewares/auth.middleware.ts";
import portalPluginConfigsController from "../controllers/portalPluginConfigsController.ts";

const router = express.Router();

// CRUD operations for PortalPluginConfigs
router.get("/", authMiddleware.verifyUserAccess, portalPluginConfigsController.getPortalPluginConfigs);
router.post("/", authMiddleware.verifyUserAccess, portalPluginConfigsController.createPortalPluginConfig);
router.get("/:id", authMiddleware.verifyUserAccess, portalPluginConfigsController.getPortalPluginConfigById);
router.put("/:id", authMiddleware.verifyUserAccess, portalPluginConfigsController.updatePortalPluginConfig);
router.delete("/:id", authMiddleware.verifyUserAccess, portalPluginConfigsController.deletePortalPluginConfig);

// Portal and Plugin specific operations
router.get("/portal/:portalId", authMiddleware.verifyUserAccess, portalPluginConfigsController.getPortalPluginConfigs);
router.get("/plugin/:pluginKey", authMiddleware.verifyUserAccess, portalPluginConfigsController.getPortalPluginConfigs);
router.get("/portal/:portalId/plugin/:pluginKey", authMiddleware.verifyUserAccess, portalPluginConfigsController.getPortalPluginConfigs);
router.put("/portal/:portalId/plugin/:pluginKey", authMiddleware.verifyUserAccess, portalPluginConfigsController.updatePortalPluginConfigByPortalAndPlugin);
router.delete("/portal/:portalId/plugin/:pluginKey", authMiddleware.verifyUserAccess, portalPluginConfigsController.deletePortalPluginConfigByPortalAndPlugin);

// Additional endpoints
router.patch("/portal/:portalId/plugin/:pluginKey/toggle-status", authMiddleware.verifyUserAccess, portalPluginConfigsController.togglePortalPluginStatus);
router.patch("/portal/:portalId/plugin/:pluginKey/increment-usage", authMiddleware.verifyUserAccess, portalPluginConfigsController.incrementUsageCount);
router.patch("/portal/:portalId/plugin/:pluginKey/increment-error", authMiddleware.verifyUserAccess, portalPluginConfigsController.incrementErrorCount);

export default router;