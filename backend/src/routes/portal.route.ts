import express from "express";
import portalController from "../controllers/portal.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", portalController.getPortals);
router.post("/", authMiddleware.verifyUserAccess, portalController.createPortal);
router.put("/", authMiddleware.verifyUserAccess, portalController.updatePortal);
router.delete("/", authMiddleware.verifyUserAccess, portalController.deletePortal);


// Nested routes
router.post("/duplicate", authMiddleware.verifyUserAccess, portalController.duplicatePortal);
router.post("/reset", authMiddleware.verifyUserAccess, portalController.resetPortal);

export default router;

