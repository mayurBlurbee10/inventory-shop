import express from "express";
import multer from "multer";
import reportsController from "../controllers/reports.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", authMiddleware.verifyUserAccess, reportsController.getReportFiles);
router.get("/data", authMiddleware.verifyUserAccess, reportsController.getReportData);
router.post(
  "/",
  authMiddleware.verifyUserAccess,
  upload.array("file") as any,
  reportsController.uploadReportFile,
);

export default router;
