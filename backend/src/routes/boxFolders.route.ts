import express from "express";
import boxFoldersController from "../controllers/boxFolders.controller.ts";

const router = express.Router();

router.post("/", boxFoldersController.createFolder);
router.get("/", boxFoldersController.getFolders);
router.delete("/", boxFoldersController.deleteFolder);

router.post("/:folderId/share", boxFoldersController.shareFolder);

export default router;

