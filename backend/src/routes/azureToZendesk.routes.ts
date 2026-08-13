import express from "express";
import { validateWebhook, logWebhook } from "../middlewares/webhook.middleware.ts";
import azureToZendeskController from "../controllers/azureToZendesk.controller.js";

const router = express.Router();

/**
 * Azure DevOps webhook endpoint
 * Receives work item updates from Azure DevOps Service Hooks
 */
router.post(
  "/update",
  logWebhook("Azure"),
  validateWebhook,
  azureToZendeskController.handleADOUpdate
);

export default router;
