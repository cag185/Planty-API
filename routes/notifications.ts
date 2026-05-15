import "dotenv/config";
import express, { Request, Response } from "express";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const authenticateToken = require("../middleware/auth") as (req: Request, res: Response, next: () => void) => void;
import * as notificationService from "../services/notificationService";

const router = express.Router();

// Get the notifications that belong to a user.
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const notifications = await notificationService.getNotificationsByUserId(
      Number(req.query.user_id),
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create a new notification for a user.
router.post("/create", authenticateToken, async (req: Request, res: Response) => {
  try {
    const notification = await notificationService.createNotification({
      title: req.body.title,
      message: req.body.message,
      users_user_id: req.body.users_user_id,
      plant_id: req.body.plant_id,
      notification_type_id: req.body.notification_type_id,
    });
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Mark a notification as completed. Also will Acknowledge it as well.
router.post("/complete", authenticateToken, async (req: Request, res: Response) => {
  try {
    await notificationService.completeNotification({
      notification_id: req.body.notification_id,
      isForWatering: req.body.isForWatering,
      plant_id: req.body.plant_id,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Mark all user notifications as completed. Also will Acknowledge them as well.
router.post("/complete-all", authenticateToken, async (req: Request, res: Response) => {
  try {
    await notificationService.completeAllNotifications({
      user_id: req.body.user_id,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Mark a notification as acknowledged.
router.post("/acknowledge", authenticateToken, async (req: Request, res: Response) => {
  try {
    await notificationService.acknowledgeNotification({
      notification_id: req.body.notification_id,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Mark all user notifications as acknowledged.
router.post("/acknowledge-all", authenticateToken, async (req: Request, res: Response) => {
  try {
    await notificationService.acknowledgeAllNotifications({
      user_id: req.body.user_id,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export = router;
