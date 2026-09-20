import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import {
  buildNotificationEmailHtml,
  buildNotificationEmailText,
  sendNotificationEmail,
} from "../services/emailService";
import { Notification, User } from "../models";

const router = express.Router();

// Notification type ids, mirrored from models/NotificationType.ts.
const NOTIFICATION_TYPE_UPDATE = 1;
const NOTIFICATION_TYPE_REQUIREMENT = 2;

/**
 * Local dev tooling: renders and sends the notification email on demand so the
 * real Resend path can be exercised without creating notifications. This is a
 * manual proof of concept, not an automated test — nothing here is asserted on
 * or covered.
 *
 * These routes are unauthenticated and one of them spends Resend quota, so they
 * are hard off in production. There is no env flag to turn them back on: if a
 * production send ever needs verifying, that is a deliberate code change, not a
 * variable someone can flip. 404 rather than 403 so a disabled route looks like
 * it was never mounted.
 */
router.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }
  next();
});

// Stand-in content per notification type, so both accent treatments (amber
// "Action Required" and blue "Autonomous Updates") can be previewed.
const SAMPLE_CONTENT: Record<number, { title: string; message: string }> = {
  [NOTIFICATION_TYPE_REQUIREMENT]: {
    title: "Monstera Deliciosa needs water",
    message:
      "It has been 9 days since this plant was last watered. Give it a drink and mark the reminder complete.",
  },
  [NOTIFICATION_TYPE_UPDATE]: {
    title: "Fiddle Leaf Fig was watered",
    message:
      "Planty recorded a watering for this plant and reset its schedule. Nothing for you to do.",
  },
};

const resolveTypeId = (raw: unknown): number =>
  Number(raw) === NOTIFICATION_TYPE_REQUIREMENT
    ? NOTIFICATION_TYPE_REQUIREMENT
    : NOTIFICATION_TYPE_UPDATE;

const asString = (raw: unknown): string | undefined =>
  typeof raw === "string" && raw.trim() ? raw.trim() : undefined;

/**
 * A Notification that never touches the database. Ids are 0 because nothing
 * here is persisted; the email template only reads the type, title and message.
 */
const buildSampleNotification = (
  typeId: number,
  overrides: { title?: string; message?: string }
): Notification => {
  const now = new Date();
  const sample = SAMPLE_CONTENT[typeId] ?? SAMPLE_CONTENT[NOTIFICATION_TYPE_UPDATE];

  return {
    id: 0,
    date_created: now,
    date_deleted: null,
    date_updated: now,
    notification_type_id: typeId,
    users_user_id: 0,
    plant_id: 0,
    title: overrides.title ?? sample.title,
    message: overrides.message ?? sample.message,
    date_acknowledged: null,
    date_completed: null,
    acknowledged: false,
    completed: false,
  };
};

// Likewise a throwaway User. The template reads name and email only; the opt-in
// flag is set true because these routes bypass the usual opt-in check.
const buildSampleUser = (email: string, name: string): User => {
  const now = new Date();

  return {
    id: 0,
    date_created: now,
    date_deleted: null,
    date_updated: now,
    name,
    email,
    password: "",
    enabled_email_notifications: true,
  };
};

/**
 * Renders the notification email without sending anything.
 *
 *   GET /test/TestBuildTestEmail
 *   GET /test/TestBuildTestEmail?type=2&format=source
 *
 * Query params, all optional:
 *   type    1 = Autonomous Update (blue, default), 2 = Action Required (amber)
 *   title   overrides the sample title
 *   message overrides the sample message
 *   name    overrides the greeting name in the footer
 *   format  html   (default) rendered in the browser
 *           source the HTML as text/plain, ready to copy and paste elsewhere
 *           json   { html, text } for both bodies at once
 */
router.get("/TestBuildTestEmail", (req: Request, res: Response) => {
  try {
    const typeId = resolveTypeId(req.query.type);
    const notification = buildSampleNotification(typeId, {
      title: asString(req.query.title),
      message: asString(req.query.message),
    });
    const user = buildSampleUser(
      process.env.TEST_EMAIL_ADDRESS || "test@example.com",
      asString(req.query.name) ?? "Test User"
    );

    const html = buildNotificationEmailHtml(notification, user);
    const text = buildNotificationEmailText(notification, user);

    switch (asString(req.query.format)) {
      case "json":
        return res.json({ notification_type_id: typeId, subject: notification.title, html, text });
      case "source":
        // text/plain so the browser shows the markup instead of rendering it.
        res.type("text/plain");
        return res.send(html);
      default:
        res.type("text/html");
        return res.send(html);
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Sends a real email through Resend to TEST_EMAIL_ADDRESS.
 *
 *   POST /test/TestSendTestEmail
 *   POST /test/TestSendTestEmail  { "type": 2, "title": "...", "message": "..." }
 *
 * The recipient is always TEST_EMAIL_ADDRESS from the environment — it is
 * deliberately not accepted from the request, so this cannot be used to mail
 * arbitrary people. Body params match the query params on TestBuildTestEmail.
 */
router.post("/TestSendTestEmail", async (req: Request, res: Response) => {
  try {
    const to = asString(process.env.TEST_EMAIL_ADDRESS);
    if (!to) {
      return res.status(400).json({
        error: "TEST_EMAIL_ADDRESS is not set – add it to the environment before sending.",
      });
    }

    const typeId = resolveTypeId(req.body?.type);
    const notification = buildSampleNotification(typeId, {
      title: asString(req.body?.title),
      message: asString(req.body?.message),
    });
    const user = buildSampleUser(to, asString(req.body?.name) ?? "Test User");

    const sent = await sendNotificationEmail(notification, user);

    if (!sent) {
      // sendNotificationEmail swallows its own failures by design, so all we
      // get back is false. The detail is in the [email] log lines.
      return res.status(502).json({
        error:
          "Resend did not accept the email. Check the [email] log lines – the usual causes are a missing RESEND_API_KEY or RESEND_FROM_EMAIL, or a from address on an unverified domain.",
        to,
      });
    }

    res.json({
      message: "Test email sent",
      to,
      notification_type_id: typeId,
      subject: notification.title,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export = router;
