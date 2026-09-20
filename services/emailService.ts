import "dotenv/config";
import { Resend } from "resend";
import { Notification, User } from "../models";

// Notification type ids, mirrored from models/NotificationType.ts and the
// notificationTypes map on the front end.
const NOTIFICATION_TYPE_UPDATE = 1;
const NOTIFICATION_TYPE_REQUIREMENT = 2;

// Palette lifted from the front end's tailwind.config.js so the email reads as
// the same component as the card on the notifications page.
const COLORS = {
  primary600: "#43a047",
  primary700: "#388e3c",
  surface50: "#fafafa",
  surface200: "#eeeeee",
  textPrimary: "#212121",
  textSecondary: "#6b7280",
  textTertiary: "#9ca3af",
};

// Per-type accents. These match the two hard-coded branches in the front end's
// notifications.vue: amber for "Action Required", blue for "Autonomous Updates".
interface NotificationAccent {
  heading: string;
  cardBackground: string;
  cardBorder: string;
  iconBackground: string;
  iconColor: string;
  glyph: string;
}

const ACCENTS: Record<number, NotificationAccent> = {
  [NOTIFICATION_TYPE_REQUIREMENT]: {
    heading: "Action Required",
    // bg-amber-50/50 over white, border-amber-200, bg-amber-100, text-amber-600
    cardBackground: "#fffdf5",
    cardBorder: "#fde68a",
    iconBackground: "#fef3c7",
    iconColor: "#d97706",
    glyph: "!",
  },
  [NOTIFICATION_TYPE_UPDATE]: {
    heading: "Autonomous Updates",
    // bg-blue-50/50 over white, border-blue-200, bg-blue-100, text-blue-500
    cardBackground: "#f7fafd",
    cardBorder: "#bfdbfe",
    iconBackground: "#dbeafe",
    iconColor: "#3b82f6",
    glyph: "i",
  },
};

const FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const HEADING_FONT_STACK =
  "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

// Titles and messages are built from user-supplied plant names and species, so
// they have to be escaped before being interpolated into the markup.
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

let cachedClient: Resend | null = null;

const getClient = (): Resend | null => {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not set – skipping email send.");
    return null;
  }

  cachedClient = new Resend(apiKey);
  return cachedClient;
};

const getAccent = (notificationTypeId: number) =>
  ACCENTS[notificationTypeId] ?? ACCENTS[NOTIFICATION_TYPE_UPDATE];

/**
 * Absolute link to the notifications page for whichever environment sent the
 * mail. Returns null when APP_BASE_URL is unset — a relative URL is meaningless
 * in an inbox, so the link is left out entirely rather than rendered broken.
 */
const getNotificationsUrl = (): string | null => {
  const baseUrl = process.env.APP_BASE_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    console.warn("[email] APP_BASE_URL is not set – omitting the link to the app.");
    return null;
  }
  return `${baseUrl}/notifications`;
};

export const buildNotificationEmailHtml = (
  notification: Notification,
  user: User
): string => {
  const accent = getAccent(notification.notification_type_id);
  const title = escapeHtml(notification.title);
  const message = escapeHtml(notification.message);
  const greetingName = escapeHtml(user.name);
  const notificationsUrl = getNotificationsUrl();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${COLORS.surface50}; font-family:${FONT_STACK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.surface50}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

            <!-- Brand header -->
            <tr>
              <td style="padding-bottom:24px;">
                <span style="font-family:${HEADING_FONT_STACK}; font-size:20px; font-weight:700; color:${COLORS.primary600};">Planty</span>
              </td>
            </tr>

            <!-- Section heading, mirrors the h2 above each list on the notifications page -->
            <tr>
              <td style="padding-bottom:16px; font-size:12px; font-weight:600; color:${COLORS.textSecondary}; text-transform:uppercase; letter-spacing:0.05em;">
                ${accent.heading}
              </td>
            </tr>

            <!-- Notification card -->
            <tr>
              <td style="background-color:${accent.cardBackground}; border:1px solid ${accent.cardBorder}; border-radius:16px; padding:20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <!-- Icon chip -->
                    <td width="40" valign="top" style="width:40px; padding-right:16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:40px; height:40px; background-color:${accent.iconBackground}; border-radius:12px;">
                        <tr>
                          <td align="center" valign="middle" style="width:40px; height:40px; font-family:${HEADING_FONT_STACK}; font-size:18px; font-weight:700; color:${accent.iconColor};">
                            ${accent.glyph}
                          </td>
                        </tr>
                      </table>
                    </td>

                    <!-- Body -->
                    <td valign="top">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="font-size:14px; font-weight:700; color:${COLORS.textPrimary};">
                            ${title}
                          </td>
                          <td align="right" valign="top" style="font-size:12px; color:${COLORS.textTertiary}; white-space:nowrap; padding-left:8px;">
                            Just now
                          </td>
                        </tr>
                      </table>
                      <p style="margin:6px 0 0 0; font-size:14px; line-height:20px; color:${COLORS.textSecondary};">
                        ${message}
                      </p>
                      ${
                        notificationsUrl
                          ? `<p style="margin:16px 0 0 0; font-size:12px; line-height:18px;">
                        <a href="${notificationsUrl}" style="color:${COLORS.primary700}; font-weight:500; text-decoration:underline;">View in Planty</a>
                      </p>`
                          : ""
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding-top:24px; font-size:12px; line-height:18px; color:${COLORS.textTertiary};">
                Hi ${greetingName} — you're getting this because email notifications are turned on for your Planty account.
                You can turn them off any time in your settings.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export const buildNotificationEmailText = (
  notification: Notification,
  user: User
): string => {
  const accent = getAccent(notification.notification_type_id);
  const notificationsUrl = getNotificationsUrl();

  return [
    `Planty – ${accent.heading}`,
    "",
    notification.title,
    notification.message,
    ...(notificationsUrl ? ["", `View it in Planty: ${notificationsUrl}`] : []),
    "",
    `Hi ${user.name} — you're getting this because email notifications are turned on for your Planty account.`,
  ].join("\n");
};

/**
 * Emails a user about a notification that was just created.
 *
 * This is best-effort: a failure to send must never take down the notification
 * write that triggered it, so every error is logged and swallowed. Returns
 * whether an email actually went out.
 */
export const sendNotificationEmail = async (
  notification: Notification,
  user: User
): Promise<boolean> => {
  const client = getClient();
  if (!client) return false;

  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    console.warn("[email] RESEND_FROM_EMAIL is not set – skipping email send.");
    return false;
  }

  if (!user.email) {
    console.warn(`[email] User ${user.id} has no email address – skipping send.`);
    return false;
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to: user.email,
      subject: notification.title,
      html: buildNotificationEmailHtml(notification, user),
      text: buildNotificationEmailText(notification, user),
    });

    if (error) {
      console.error(
        `[email] Resend rejected the notification email for user ${user.id}:`,
        error
      );
      return false;
    }

    console.log(
      `[email] Sent notification ${notification.id} to user ${user.id} (resend id ${data?.id}).`
    );
    return true;
  } catch (err) {
    console.error(
      `[email] Failed to send notification email for user ${user.id}:`,
      err
    );
    return false;
  }
};
