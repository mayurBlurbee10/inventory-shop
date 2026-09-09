import express from "express";
import boxFoldersController from "../controllers/boxFolders.controller.ts";
import { requireAccessControl } from "../middlewares/accesscontrol.middleware.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.post("/", authMiddleware.verifyUserAccess, requireAccessControl("shareddocs", "createfolder"), boxFoldersController.createFolder);
router.get("/", authMiddleware.verifyUserAccess, requireAccessControl("shareddocs", "getfiles"), boxFoldersController.getFolders);
router.delete("/", authMiddleware.verifyUserAccess, requireAccessControl("shareddocs", "deletefile"), boxFoldersController.deleteFolder);

router.post("/:folderId/share", boxFoldersController.shareFolder);

export default router;

