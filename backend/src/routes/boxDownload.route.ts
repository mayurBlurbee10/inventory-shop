import express from "express";
import boxDownloadController from "../controllers/boxDownload.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", authMiddleware.verifyUserAccess, boxDownloadController.downloadFile);

export default router;

