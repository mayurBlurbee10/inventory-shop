import express from "express";
import pageController from "../controllers/page.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", pageController.getPage);
router.post("/", authMiddleware.verifyUserAccess, pageController.createPage);
router.put("/", authMiddleware.verifyUserAccess, pageController.updatePage);
router.delete("/", authMiddleware.verifyUserAccess, pageController.deletePage);

// Nested routes
router.post("/bulk", authMiddleware.verifyUserAccess, pageController.bulkCreatePages);
router.delete("/bulk", authMiddleware.verifyUserAccess, pageController.bulkDeletePages);
router.put("/status", authMiddleware.verifyUserAccess, pageController.updatePageStatus);

export default router;

