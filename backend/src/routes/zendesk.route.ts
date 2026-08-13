import express from "express";
import multer from "multer";
import zendeskController from "../controllers/zendesk.controller.ts";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post(
  "/",
  upload.array("files") as any,
  zendeskController.createSupportTicket
);
router.post("/update",zendeskController.updateZendeskTicketToADO);

export default router;
