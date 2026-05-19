import express from "express";
import chartController from "../controllers/chart.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", authMiddleware.verifyUserAccess, chartController.getChartData);

// Nested routes
router.get("/report", authMiddleware.verifyUserAccess, chartController.getReportData);

export default router;

