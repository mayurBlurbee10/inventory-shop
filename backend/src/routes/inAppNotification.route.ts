import express from "express";
import authMiddleware from "../middlewares/auth.middleware.ts";
import inAppNotificationController from "../controllers/inAppNotification.controller.ts";

const router = express.Router();

// Push subscription management
router.post("/", inAppNotificationController.addPushSubscription);

// Send notification to a user (e.g. new message) – must be before /:notificationId
router.post(
  "/send",
  authMiddleware.verifyUserAccess,
  inAppNotificationController.sendNotificationToUser,
);

// Notification management for bell icon
router.get(
  "/",
  authMiddleware.verifyUserAccess,
  inAppNotificationController.getUserNotifications,
);
router.get(
  "/unread-count",
  authMiddleware.verifyUserAccess,
  inAppNotificationController.getUnreadNotificationCount,
);
router.put(
  "/:notificationId/read",
  authMiddleware.verifyUserAccess,
  inAppNotificationController.markNotificationAsRead,
);
router.put(
  "/mark-all-read",
  authMiddleware.verifyUserAccess,
  inAppNotificationController.markAllNotificationsAsRead,
);
router.delete(
  "/:notificationId",
  authMiddleware.verifyUserAccess,
  inAppNotificationController.deleteNotification,
);
router.delete(
  "/",
  authMiddleware.verifyUserAccess,
  inAppNotificationController.clearAllNotifications,
);

export default router;
