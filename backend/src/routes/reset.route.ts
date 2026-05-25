import express from "express";
import resetController from "../controllers/reset.controller.ts";

const router = express.Router();

router.post("/", resetController.resetPortal);

export default router;
