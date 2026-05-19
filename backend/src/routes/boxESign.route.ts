import express from "express";
import boxESignController from "../controllers/boxESign.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", authMiddleware.verifyUserAccess, boxESignController.getSignRequests);
router.post("/", authMiddleware.verifyUserAccess, boxESignController.createSignRequest);
router.delete("/", authMiddleware.verifyUserAccess, boxESignController.cancelSignRequest);

export default router;

