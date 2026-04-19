require("dotenv").config();
var express = require("express");
var router = express.Router();
const db = require("../db");

// Get the notifications that belong to a user.
router.get("/", function (req, res) {
  const userId = req.query.user_id;
  db.connection.query(
    `SELECT * FROM notifications_notification WHERE users_user_id = ?`,
    [userId],
    function (error, results) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json(results);
    },
  );
});

// Create a new notification for a user.
router.post("/create", function (req, res) {
  const { title, message, users_user_id, plants_plant_id } = req.body;
  if (!title || !message || !users_user_id || !plants_plant_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  db.connection.query(
    `INSERT INTO notifications_notification (title, message, users_user_id, plants_plant_id) VALUES (?, ?, ?, ?)`,
    [title, message, users_user_id, plants_plant_id],
    function (error, results) {
      if (error) {
        console.error("Error creating new notification:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json({
        id: results.insertId,
        title,
        message,
        users_user_id,
        plants_plant_id,
      });
    },
  );
});

// Mark a notification as completed. Also will Acknowledge it as well.
router.post("/complete", function (req, res) {
  const notificationId = req.body.notification_id;
  if (!notificationId) {
    return res.status(400).json({ error: "notification_id is required" });
  }
  db.connection.query(
    `UPDATE notifications_notification 
    SET completed = TRUE, 
    acknowledged = TRUE,
    date_completed = NOW(),
    date_acknowledged = NOW()
    WHERE id = ?`,
    [notificationId],
    function (error, results) {
      if (error) {
        console.error("Error marking notification as completed:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json({ success: true });
    },
  );
});

// Mark a notification as acknowledged.
router.post("/acknowledge", function (req, res) {
  const notificationId = req.body.notification_id;
  if (!notificationId) {
    return res.status(400).json({ error: "notification_id is required" });
  }
  db.connection.query(
    `UPDATE notifications_notification
    SET acknowledged = TRUE,
    date_acknowledged = NOW()
    WHERE id = ?`,
    [notificationId],
    function (error, results) {
      if (error) {
        console.error("Error marking notification as acknowledged:", error);
        return res.status(500).json({ error: error.message });
      }
      res.json({ success: true });
    },
  );
});

module.exports = router;
