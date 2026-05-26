import express from "express";
import zendeskToAzureController from "../controllers/zendeskToAzure.controller.ts";
const router = express.Router();

router.post(
  "/",
  zendeskToAzureController.createZendeskToAzureTicket
);
export default router;