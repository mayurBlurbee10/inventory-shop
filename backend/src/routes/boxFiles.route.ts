import express from "express";
import multer from "multer";
import boxFilesController from "../controllers/boxFiles.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Main routes
router.get("/", authMiddleware.verifyUserAccess, boxFilesController.getFiles as any);
router.post("/", authMiddleware.verifyUserAccess, upload.array("file") as any, boxFilesController.uploadFiles as any);
router.put("/", authMiddleware.verifyUserAccess, boxFilesController.updateFileName);
router.delete("/", authMiddleware.verifyUserAccess, boxFilesController.deleteFile);

// Nested routes
router.post("/duplicate", authMiddleware.verifyUserAccess, boxFilesController.duplicateFiles);
router.get("/proxy-file", boxFilesController.getProxyFile);
router.post("/replace", upload.array("file") as any, authMiddleware.verifyUserAccess, boxFilesController.replaceFiles as any);
router.get("/share", authMiddleware.verifyUserAccess, boxFilesController.getFileShare);
router.post("/share", authMiddleware.verifyUserAccess, boxFilesController.addFileCollaborator);
router.delete("/share", authMiddleware.verifyUserAccess, boxFilesController.removeFileCollaborator);

export default router;

