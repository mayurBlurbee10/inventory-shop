import express from "express";
import apiLogsController from "../controllers/apiLogs.controller.ts";

const router = express.Router();

router.post("/", apiLogsController.createApiLog);

export default router;

