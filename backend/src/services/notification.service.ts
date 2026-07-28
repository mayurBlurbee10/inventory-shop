import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Users } from "../entities/Users.ts";
import { sendWelcomeLoginEmail } from "../utils/email.ts";
import { NotificationConfigure } from "../config/constants.ts";

const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

/**
 * Get user notification preferences
 */
const getNotificationPreferences = async (userId: string) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new Error("User not found");
    }
    // Parse JSON if it's a string, otherwise return as is
    const prefs =
      typeof user.notificationPreferences === "string"
        ? JSON.parse(user.notificationPreferences)
        : user.notificationPreferences || {};
    return prefs;
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    throw error;
  }
};

/**
 * Update user notification preferences (merge with existing)
 */
const updateNotificationPreferences = async (
  userId: string,
  preferences: any
) => {
  const userRepository = await getRepository(Users);
  try {
    const user = await userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new Error("User not found");
    }

    // Get existing preferences
    const existingPrefs =
      typeof user.notificationPreferences === "string"
        ? JSON.parse(user.notificationPreferences)
        : user.notificationPreferences || {};

    // Merge new preferences
    const mergedPrefs = { ...existingPrefs, ...preferences };

    // Update user
    user.notificationPreferences = mergedPrefs;
    await userRepository.save(user);

    return mergedPrefs;
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    throw error;
  }
};

/**
 * Check if a specific notification type is enabled for user
 */
const isNotificationEnabled = async (
  userId: string,
  notificationType: string
): Promise<boolean> => {
  try {
    const prefs = await getNotificationPreferences(userId);
    // Default to true if not explicitly set to false
    return prefs[notificationType] !== false;
  } catch (error) {
    console.error(
      `Error checking notification ${notificationType} for user ${userId}:`,
      error
    );
    // Default to true on error (safe default)
    return true;
  }
};

/**
 * Send welcome login email if enabled
 */
const sendWelcomeLoginNotification = async (
  userId: string,
  userEmail: string,
  userName: string,
  portalId: string = "Universal Portal Demo"
) => {
  try {
    // Check if welcome_login_email is enabled
    const isEnabled = await isNotificationEnabled(userId, NotificationConfigure.WELCOME_LOGIN_EMAIL);

    if (!isEnabled) {
      console.log(
        `Welcome login email disabled for user ${userId}, skipping...`
      );
      return { success: false, reason: "notification_disabled" };
    }

    // Send the email
    await sendWelcomeLoginEmail(userEmail, userName, portalId);
    console.log(`Welcome login email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending welcome login notification:", error);
    return { success: false, reason: "email_send_failed" };
  }
};

/**
 * Get all available notification types
 */
const getAvailableNotificationTypes = () => {
  return [
    {
      key: NotificationConfigure.WELCOME_LOGIN_EMAIL,
      label: "Welcome Login Email",
      description: "Receive a welcome email when you login",
      category: "authentication",
    },
    {
      key: NotificationConfigure.INVITE_LINK_EMAIL,
      label: "Invite & Reset Password Email",
      description: "Receive invitation and password reset emails",
      category: "authentication",
    },
    {
      key: NotificationConfigure.MESSAGE_IN_APP,
      label: "Message",
      description: "Receive an when someone sends you a message",
      category: "message",
    },
    {
      key: NotificationConfigure.TASK_IN_APP,
      label: "Task",
      description: "Receive a notification when a task is assigned to you",
      category: "task",
    },
  ];
};

export default {
  getNotificationPreferences,
  updateNotificationPreferences,
  isNotificationEnabled,
  sendWelcomeLoginNotification,
  getAvailableNotificationTypes,
};
