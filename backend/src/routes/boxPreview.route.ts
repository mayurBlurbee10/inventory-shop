import express from "express";
import boxPreviewController from "../controllers/boxPreview.controller.ts";

const router = express.Router();

router.get("/:fileId", boxPreviewController.getPreview);

export default router;

