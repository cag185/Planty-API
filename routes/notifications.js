require("dotenv").config();
var express = require("express");
var router = express.Router();
const authenticateToken = require("../middleware/auth");
import {
  getNotificationsByUserId,
  createNotification,
  completeNotification,
  completeAllNotifications,
  acknowledgeNotification,
  acknowledgeAllNotifications,
} from "../services/notificationService";

// Get the notifications that belong to a user.
router.get("/", authenticateToken, async (req, res) => {
  try {
    const notifications = await getNotificationsByUserId(
      Number(req.query.user_id),
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new notification for a user.
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const notification = await createNotification({
      title: req.body.title,
      message: req.body.message,
      users_user_id: req.body.users_user_id,
      plant_id: req.body.plant_id,
      notification_type_id: req.body.notification_type_id,
    });
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark a notification as completed. Also will Acknowledge it as well.
router.post("/complete", authenticateToken, async (req, res) => {
  try {
    await completeNotification({ notification_id: req.body.notification_id });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark all user notifications as completed. Also will Acknowledge them as well.
router.post("/complete-all", authenticateToken, async (req, res) => {
  try {
    await completeAllNotifications({ user_id: req.body.user_id });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark a notification as acknowledged.
router.post("/acknowledge", authenticateToken, async (req, res) => {
  try {
    await acknowledgeNotification({
      notification_id: req.body.notification_id,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark all user notifications as acknowledged.
router.post("/acknowledge-all", authenticateToken, async (req, res) => {
  try {
    await acknowledgeAllNotifications({ user_id: req.body.user_id });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
