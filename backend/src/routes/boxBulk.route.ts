import express from "express";
import boxBulkController from "../controllers/boxBulk.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

// Nested routes
router.post("/copy", authMiddleware.verifyUserAccess, boxBulkController.bulkCopy);
router.post("/delete", authMiddleware.verifyUserAccess, boxBulkController.bulkDelete);
router.post("/download", authMiddleware.verifyUserAccess, boxBulkController.bulkDownload);
router.post("/move", authMiddleware.verifyUserAccess, boxBulkController.bulkMove);

export default router;

