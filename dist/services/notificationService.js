"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acknowledgeAllNotifications = exports.acknowledgeNotification = exports.completeAllNotifications = exports.completeNotification = exports.createNotification = exports.getNotificationsByUserId = void 0;
const db_helpers_1 = require("./db-helpers");
const validateCreateNotificationRequest = (req) => {
    const missing = [];
    if (!req.title)
        missing.push("title");
    if (!req.message)
        missing.push("message");
    if (!req.users_user_id)
        missing.push("users_user_id");
    if (!req.plant_id)
        missing.push("plant_id");
    if (!req.notification_type_id)
        missing.push("notification_type_id");
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }
};
const validateCompleteNotificationRequest = (req) => {
    if (!req.notification_id)
        throw new Error("notification_id is required");
};
const validateCompleteAllNotificationsRequest = (req) => {
    if (!req.user_id)
        throw new Error("user_id is required");
};
const validateAcknowledgeNotificationRequest = (req) => {
    if (!req.notification_id)
        throw new Error("notification_id is required");
};
const validateAcknowledgeAllNotificationsRequest = (req) => {
    if (!req.user_id)
        throw new Error("user_id is required");
};
const getNotificationsByUserId = async (userId) => {
    return (0, db_helpers_1.query)("SELECT * FROM notifications_notification WHERE users_user_id = ?", [userId]);
};
exports.getNotificationsByUserId = getNotificationsByUserId;
const createNotification = async (req) => {
    validateCreateNotificationRequest(req);
    const result = await (0, db_helpers_1.execute)(`INSERT INTO notifications_notification (title, message, users_user_id, plant_id, notification_type_id)
     VALUES (?, ?, ?, ?, ?)`, [
        req.title,
        req.message,
        req.users_user_id,
        req.plant_id,
        req.notification_type_id,
    ]);
    const rows = await (0, db_helpers_1.query)("SELECT * FROM notifications_notification WHERE id = ?", [result.insertId]);
    return rows[0];
};
exports.createNotification = createNotification;
const completeNotification = async (req) => {
    validateCompleteNotificationRequest(req);
    const result = await (0, db_helpers_1.execute)(`UPDATE notifications_notification
     SET completed = TRUE,
         acknowledged = TRUE,
         date_completed = NOW(),
         date_acknowledged = NOW()
     WHERE id = ?`, [req.notification_id]);
    return result.affectedRows > 0;
};
exports.completeNotification = completeNotification;
const completeAllNotifications = async (req) => {
    validateCompleteAllNotificationsRequest(req);
    const result = await (0, db_helpers_1.execute)(`UPDATE notifications_notification
     SET completed = TRUE,
         acknowledged = TRUE,
         date_completed = NOW(),
         date_acknowledged = NOW()
     WHERE users_user_id = ?`, [req.user_id]);
    return result.affectedRows > 0;
};
exports.completeAllNotifications = completeAllNotifications;
const acknowledgeNotification = async (req) => {
    validateAcknowledgeNotificationRequest(req);
    const result = await (0, db_helpers_1.execute)(`UPDATE notifications_notification
     SET acknowledged = TRUE,
         date_acknowledged = NOW()
     WHERE id = ?`, [req.notification_id]);
    return result.affectedRows > 0;
};
exports.acknowledgeNotification = acknowledgeNotification;
const acknowledgeAllNotifications = async (req) => {
    validateAcknowledgeAllNotificationsRequest(req);
    const result = await (0, db_helpers_1.execute)(`UPDATE notifications_notification
     SET acknowledged = TRUE,
         date_acknowledged = NOW()
     WHERE users_user_id = ?`, [req.user_id]);
    return result.affectedRows > 0;
};
exports.acknowledgeAllNotifications = acknowledgeAllNotifications;
