import express from "express";
import userController from "../controllers/user.controller.ts";
import authMiddleware from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.get("/", userController.getUsers);
router.get("/current", userController.getCurrentUser);
router.post("/", userController.createUser);
router.post("/bulk", userController.bulkCreateUsers);
router.post("/resendInviteLink", userController.resendInviteLink);
router.post("/updatePassword", userController.updatePassword);
router.post("/loginByProvider", userController.handleLoginByProvider);
router.put("/", userController.updateUser);
router.patch("/", userController.patchUser);
router.put("/tncAccept", userController.acceptTNC);
router.put("/role", userController.updateRole);
router.delete("/", userController.deleteUser);
router.get("/notification-preferences", authMiddleware.verifyUserAccess, userController.getNotificationPreferences);
router.patch("/notification-preferences", authMiddleware.verifyUserAccess, userController.updateNotificationPreferences);

export default router;

