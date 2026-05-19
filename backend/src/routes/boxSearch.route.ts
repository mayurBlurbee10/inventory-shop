import express from "express";
import boxSearchController from "../controllers/boxSearch.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", authMiddleware.verifyUserAccess, boxSearchController.searchFiles);

export default router;

