import express from "express";
import multer from "multer";
import uploadController from "../controllers/upload.controller.ts";
import uploadFilenameController from "../controllers/uploadFilename.controller.ts";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file") as any, uploadController.uploadFile as any);

// Nested routes - dynamic filename route
router.get("/:filename", uploadFilenameController.getUploadedFile);

export default router;

