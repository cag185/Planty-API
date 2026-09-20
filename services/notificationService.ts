import { query, execute } from "./db-helpers";
import { getIO } from "./socket";
import { sendNotificationEmail } from "./emailService";
import { Notification, User } from "../models";
import {
  CreateNotificationRequest,
  CompleteNotificationRequest,
  CompleteAllNotificationsRequest,
  AcknowledgeNotificationRequest,
  AcknowledgeAllNotificationsRequest,
} from "../requests";

const validateCreateNotificationRequest = (
  req: CreateNotificationRequest
): void => {
  const missing: string[] = [];
  if (!req.title) missing.push("title");
  if (!req.message) missing.push("message");
  if (!req.users_user_id) missing.push("users_user_id");
  if (!req.plant_id) missing.push("plant_id");
  if (!req.notification_type_id) missing.push("notification_type_id");
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }
};

const validateCompleteNotificationRequest = (
  req: CompleteNotificationRequest
): void => {
  if (!req.notification_id) throw new Error("notification_id is required");
};

const validateCompleteAllNotificationsRequest = (
  req: CompleteAllNotificationsRequest
): void => {
  if (!req.user_id) throw new Error("user_id is required");
};

const validateAcknowledgeNotificationRequest = (
  req: AcknowledgeNotificationRequest
): void => {
  if (!req.notification_id) throw new Error("notification_id is required");
};

const validateAcknowledgeAllNotificationsRequest = (
  req: AcknowledgeAllNotificationsRequest
): void => {
  if (!req.user_id) throw new Error("user_id is required");
};

export const getNotificationsByUserId = async (
  userId: number
): Promise<Notification[]> => {
  return query<Notification>(
    "SELECT * FROM notifications_notification WHERE users_user_id = ?",
    [userId]
  );
};

export const createNotification = async (
  req: CreateNotificationRequest
): Promise<Notification> => {
  validateCreateNotificationRequest(req);
  const result = await execute(
    `INSERT INTO notifications_notification (title, message, users_user_id, plant_id, notification_type_id)
     VALUES (?, ?, ?, ?, ?)`,
    [
      req.title,
      req.message,
      req.users_user_id,
      req.plant_id,
      req.notification_type_id,
    ]
  );

  const rows = await query<Notification>(
    "SELECT * FROM notifications_notification WHERE id = ?",
    [result.insertId]
  );

  // Push the new notification to the user's socket room.
  const notification = rows[0];
  try {
    getIO().to(`user:${req.users_user_id}`).emit("notification:new", notification);
  } catch (err) {
    console.warn("[socket.io] Could not emit notification:new –", err);
  }

  // Mirror the notification to the user's inbox, if they've opted in.
  await emailNotificationIfEnabled(notification);

  return notification;
};

/**
 * Sends the notification by email when the recipient has email notifications
 * turned on in their settings.
 *
 * The user is loaded here rather than through userService to avoid a require
 * cycle (userService -> plantService -> notificationService). Failures are
 * logged and swallowed so a mail problem can never fail the notification write.
 */
const emailNotificationIfEnabled = async (
  notification: Notification
): Promise<void> => {
  try {
    const users = await query<User>(
      "SELECT * FROM users_user WHERE id = ? AND date_deleted IS NULL",
      [notification.users_user_id]
    );
    const user = users[0];

    if (!user) {
      console.warn(
        `[email] No user ${notification.users_user_id} for notification ${notification.id} – skipping email.`
      );
      return;
    }

    // enabled_email_notifications is a tinyint(1), so this is 0/1 rather than a
    // real boolean coming out of MySQL.
    if (!user.enabled_email_notifications) return;

    await sendNotificationEmail(notification, user);
  } catch (err) {
    console.error(
      `[email] Could not email notification ${notification.id} –`,
      err
    );
  }
};

export const completeNotification = async (
  req: CompleteNotificationRequest
): Promise<boolean> => {
  validateCompleteNotificationRequest(req);

  // Check if the notification to complete is about watering a plant.
  // Note - this is for requirement notifications where the tracking depends on a user not the autonomous system.
  if (req.isForWatering) {
    // validate that we have a non null plant id.
    if (!req.plant_id) {
      throw new Error("plant_id is required when completing a watering notification");
    }

    // If so, we need to also update the last_watered date for the plant.
    // @todo - this should be in the plant service.
    const plantResult = await execute(
      `UPDATE plants_plant
       SET date_last_watered = NOW()
       WHERE id = ?`,
      [req.plant_id]
    )

    if(!plantResult.affectedRows) {
      throw new Error("Failed to update plant's last watered date");
    }
    console.log(`Updated plant ${req.plant_id} last watered date due to completion of watering notification ${req.notification_id}`);
  }

  // Fall through should update the notification in the db as complete.
  const result = await execute(
    `UPDATE notifications_notification
     SET completed = TRUE,
         acknowledged = TRUE,
         date_completed = NOW(),
         date_acknowledged = NOW()
     WHERE id = ?`,
    [req.notification_id]
  );
  console.log(`Completed notification ${req.notification_id} with result:`, result);
  return result.affectedRows > 0;
};

export const completeAllNotifications = async (
  req: CompleteAllNotificationsRequest
): Promise<boolean> => {
  validateCompleteAllNotificationsRequest(req);
  const result = await execute(
    `UPDATE notifications_notification
     SET completed = TRUE,
         acknowledged = TRUE,
         date_completed = NOW(),
         date_acknowledged = NOW()
     WHERE users_user_id = ?`,
    [req.user_id]
  );
  return result.affectedRows > 0;
};

export const acknowledgeNotification = async (
  req: AcknowledgeNotificationRequest
): Promise<boolean> => {
  validateAcknowledgeNotificationRequest(req);
  const result = await execute(
    `UPDATE notifications_notification
     SET acknowledged = TRUE,
         date_acknowledged = NOW()
     WHERE id = ?`,
    [req.notification_id]
  );
  return result.affectedRows > 0;
};

export const acknowledgeAllNotifications = async (
  req: AcknowledgeAllNotificationsRequest
): Promise<boolean> => {
  validateAcknowledgeAllNotificationsRequest(req);
  const result = await execute(
    `UPDATE notifications_notification
     SET acknowledged = TRUE,
         date_acknowledged = NOW()
     WHERE users_user_id = ?`,
    [req.user_id]
  );
  return result.affectedRows > 0;
};

// Service call to delete all notifications connected to a plant.
export const deleteNotificationsForPlant = async (
  plantId: number
): Promise<boolean> => {
  const result = await execute(
    `DELETE FROM notifications_notification WHERE plant_id = ?`,
    [plantId]
  );
  return result.affectedRows > 0;
};
