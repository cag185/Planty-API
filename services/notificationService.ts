import { query, execute } from "./db-helpers";
import { Notification } from "../models";
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

  return rows[0];
};

export const completeNotification = async (
  req: CompleteNotificationRequest
): Promise<boolean> => {
  validateCompleteNotificationRequest(req);
  const result = await execute(
    `UPDATE notifications_notification
     SET completed = TRUE,
         acknowledged = TRUE,
         date_completed = NOW(),
         date_acknowledged = NOW()
     WHERE id = ?`,
    [req.notification_id]
  );
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
