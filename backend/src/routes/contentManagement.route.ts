import express from "express";
import contentManagementController from "../controllers/contentManagement.controller.ts";

const router = express.Router();

router.get("/", contentManagementController.getContentManagement);
router.post("/", contentManagementController.createContentManagement);
router.put("/", contentManagementController.updateContentManagement);
router.delete("/", contentManagementController.deleteContentManagement);
router.get("/type", contentManagementController.getContentTypes);
router.post("/type", contentManagementController.createContentType);

export default router;

