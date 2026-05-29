import express from "express";
import boxEventsController from "../controllers/boxEvents.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", authMiddleware.verifyUserAccess, boxEventsController.getEvents);
router.get("/export", authMiddleware.verifyUserAccess, boxEventsController.exportEvents);

export default router;
