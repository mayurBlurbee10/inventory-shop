import express from "express";
import boxAI from "./box-ai/box-ai.routes.js";


const router = express.Router();

router.use("/box-ai", boxAI);

export default router;