import express from "express";
import taskController from "../controllers/task.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", authMiddleware.verifyUserAccess, taskController.getTasks);
router.post("/", authMiddleware.verifyUserAccess, taskController.createTask);
router.put("/", authMiddleware.verifyUserAccess, taskController.updateTask);
router.delete("/", authMiddleware.verifyUserAccess, taskController.deleteTask);

export default router;

