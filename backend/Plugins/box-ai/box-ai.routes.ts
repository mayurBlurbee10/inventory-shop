
import express from "express";
import boxHubController from "./box-ai.controller.js";
import authMiddleware from "../../src/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/hubs", authMiddleware.verifyUserAccess, boxHubController.getHubs);
router.post("/hubs/add-items", authMiddleware.verifyUserAccess, boxHubController.addItemsToHub);
router.post("/hubs", authMiddleware.verifyUserAccess, boxHubController.createHub);
router.get("/ai-agents", authMiddleware.verifyUserAccess, boxHubController.listAiAgents);
router.post("/ai-ask", authMiddleware.verifyUserAccess, boxHubController.askAIHub);
router.delete("/hubs", authMiddleware.verifyUserAccess, boxHubController.deleteHub);


export default router;