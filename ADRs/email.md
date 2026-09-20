# Email Notifications

How Planty sends email, why it's built this way, and what you need to set up to
run it locally or deploy it.

## Summary

Users can opt in to receiving their in-app notifications by email. When a
notification is created, the API also mails it to the user if they've turned
email notifications on in their settings. Mail is sent through
[Resend](https://resend.com), a third-party transactional email API.

All of the email code lives in one place: [`services/emailService.ts`](../services/emailService.ts).

## Why Resend

We needed transactional email (one message, triggered by an app event, to one
recipient) rather than marketing/campaign email. Resend was chosen because it's
a simple HTTPS API with a first-class Node SDK — no SMTP credentials, no
connection pooling, no long-lived socket to babysit. The SDK is the `resend`
package in [`package.json`](../package.json).

We are not using Resend's React Email templates. The email body is plain HTML
built by hand in `emailService.ts` (see [Templates](#templates) below).

## Configuration

Three environment variables. All are read from `process.env` at send time —
nothing is validated at boot, so a missing variable will not crash the server.

| Variable            | Required | What it is                                              | If missing                                        |
| ------------------- | -------- | ------------------------------------------------------- | ------------------------------------------------- |
| `RESEND_API_KEY`    | yes      | API key from the Resend dashboard                       | No client is built. Nothing is emailed, ever.     |
| `RESEND_FROM_EMAIL` | yes      | The `From:` address, on a domain verified in Resend     | Send is skipped.                                  |
| `APP_BASE_URL`      | no       | Public origin of the front end, e.g. `https://…`        | Email still sends, without the "View in Planty" link. |
| `TEST_EMAIL_ADDRESS` | local only | Recipient for the local test-send route below         | `TestSendTestEmail` returns 400.                  |

Each of these failure paths logs a `[email]` warning and returns without
throwing. **Email failing is always silent from the caller's point of view** —
if mail isn't arriving, the logs are the only place that will tell you why.

### Where the API key lives

The key is issued by the **Resend dashboard**, and a copy has to exist in every
environment that sends mail. To stand this up somewhere new, you need it in
**both** places:

1. **Local `.env`** — copy the key in as `RESEND_API_KEY`. `.env` is
   gitignored; never commit it. `emailService.ts` does `import "dotenv/config"`,
   which is what loads it.
2. **The deployed backend's environment variables** — the API is currently
   hosted on **Railway**, so set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and
   `APP_BASE_URL` in the Railway project's Variables tab. If the API moves
   hosts, or if you're copying the key out of an older deployment's env config,
   the same three variables have to come with it.

Treat the key as a secret: don't paste it into tickets, commits, logs, or this
repo. If it's ever exposed, revoke and reissue it from the Resend dashboard —
that immediately invalidates the old one, so rotate both copies together.

### Domain verification

`RESEND_FROM_EMAIL` must be on a domain you've verified in Resend (DNS records
added for SPF/DKIM). Resend will reject sends from an unverified domain. For
quick local testing, Resend's sandbox sender works without verification but can
only deliver to your own account's address.

## How a send happens

There is no queue, cron, or worker. Sending is a side effect of creating a
notification.

1. [`notificationService.createNotification`](../services/notificationService.ts)
   inserts the notification row and emits it over socket.io.
2. It then calls `emailNotificationIfEnabled(notification)`.
3. That helper loads the user with a direct SQL query — deliberately *not*
   through `userService`, which would create a require cycle
   (`userService → plantService → notificationService`).
4. If `user.enabled_email_notifications` is falsy, it stops there.
5. Otherwise it calls `emailService.sendNotificationEmail(notification, user)`.

### The opt-in flag

`users_user.enabled_email_notifications` is added by
[`migrations/user_email_notifications.sql`](../migrations/user_email_notifications.sql).
It defaults to `FALSE` — **users are opted out until they say otherwise**. The
migration is guarded by an `information_schema` check, so it's safe to re-run
against a database that already has the column.

It's a MySQL `tinyint(1)`, so it comes back as `0`/`1`, not a real boolean.
Check it for truthiness; don't compare it with `=== true`.

Users flip it from the settings page, which hits
`POST /users/:id/update-settings` → `userService.updateUserSettings`.

> Note: `userService.enableEmailNotifications` and `disableEmailNotifications`
> exist but have no callers. `updateUserSettings` is the live path.

## Failure model

**Email is best-effort and never fails the thing that triggered it.** A user
creating a notification must not get an error because our mail provider is
down. That's enforced at two layers:

- `sendNotificationEmail` wraps its own `try/catch` *and* checks the `error`
  field on Resend's response. The SDK returns `{ data, error }` rather than
  throwing on an API-level rejection, so both have to be handled.
- `emailNotificationIfEnabled` wraps the whole call again and logs anything that
  escapes.

`sendNotificationEmail` returns a `boolean` for whether mail actually went out.
On success it logs the Resend message id, which is what you search on in the
Resend dashboard when tracing a specific delivery.

The tradeoff is that a bad key, an unverified domain, or a rate limit is
invisible in the API response and only shows up in the logs. If someone reports
"I'm not getting emails," check in this order: the user's opt-in flag, the
`[email]` log lines, then the Resend dashboard's delivery log.

## Templates

`buildNotificationEmailHtml` and `buildNotificationEmailText` produce the HTML
and plaintext bodies. Both are exported, so you can render one in a test or a
script without sending anything.

Things to know before editing them:

- **Table-based layout with inline styles.** This is not a stylistic choice —
  email clients strip `<style>` blocks and don't support modern CSS layout.
  Keep new markup in the same table/inline-style shape.
- **The palette is copied from the front end.** `COLORS` mirrors the front end's
  `tailwind.config.js`, and `ACCENTS` mirrors the two hard-coded branches in
  `notifications.vue`, so the email reads as the same component as the card in
  the app. If those change on the front end, change them here too — there's no
  shared source of truth.
- **`notification_type_id` picks the accent.** `2` (Requirement) is amber
  "Action Required"; `1` (Update) is blue "Autonomous Updates". Unknown ids fall
  back to the Update styling rather than erroring.
- **Always send `text` alongside `html`.** It improves deliverability and covers
  plaintext clients.
- **Escape anything user-supplied.** Titles and messages are built from
  user-entered plant names and species. `escapeHtml` exists for this; use it for
  any new interpolated value.

## Using the service elsewhere

If you need to send a different kind of email, follow the shape of
`sendNotificationEmail`:

```ts
import { sendNotificationEmail } from "./emailService";

const sent = await sendNotificationEmail(notification, user);
```

Guidelines for anything new you add to this file:

1. **Go through `getClient()`.** Don't construct `new Resend(...)` yourself. The
   client is lazily built on first send and memoized in a module-level variable,
   so env vars only need to be present by the time you send, not at import time.
   A `null` return means "email isn't configured here" — bail out, don't throw.
2. **Never let a send failure propagate.** Catch, log with the `[email]` prefix,
   return a boolean. The caller's real work must still succeed.
3. **Check both the throw path and the `error` field** on the Resend response.
4. **Check `user.email` exists** before sending, and respect
   `enabled_email_notifications` for anything the user can opt out of.
   Transactional mail they can't opt out of (password reset, say) is a separate
   decision — make it deliberately, don't just skip the check.
5. **Export the body builders** so they can be rendered and inspected in
   isolation.

## Local dev routes

[`routes/test.ts`](../routes/test.ts) mounts two endpoints under `/test` for
exercising email without creating real notifications. Both build a throwaway
`Notification` and `User` in memory — nothing is written to the database, and
the opt-in check is bypassed.

These are a **manual proof of concept for local development**, not part of any
test suite. There are no assertions and nothing here should be counted toward
coverage; the point is to eyeball the template and confirm a real Resend send
works before trusting the notification path.

### The two endpoints

**`GET /test/TestBuildTestEmail`** — renders the email and returns it, sending
nothing. Safe to hammer; it never touches Resend.

**`POST /test/TestSendTestEmail`** — sends a real email through Resend to
`TEST_EMAIL_ADDRESS`. The recipient always comes from the environment and is
deliberately not accepted from the request, so this can't be pointed at an
arbitrary address.

Both accept the same four optional parameters — query string on the `GET`, JSON
body on the `POST`:

| Param     | Default             | What it does                                                   |
| --------- | ------------------- | -------------------------------------------------------------- |
| `type`    | `1`                 | `1` = Autonomous Update (blue), `2` = Action Required (amber)   |
| `title`   | sample for the type | Overrides the notification title, which is also the subject     |
| `message` | sample for the type | Overrides the body copy                                         |
| `name`    | `Test User`         | Greeting name in the footer                                     |

`TestBuildTestEmail` takes one more, `format`, covered below.

## Testing these locally

### 1. Set up the environment

You need these in your local [`.env`](../.env):

```
RESEND_API_KEY=…          # from the Resend dashboard
RESEND_FROM_EMAIL=…       # on a domain verified in Resend
APP_BASE_URL=…            # optional; without it there's no "View in Planty" link
TEST_EMAIL_ADDRESS=…      # your own inbox — only used by these routes
```

Make sure `NODE_ENV` is **not** `production`, or both routes 404.

Only `TEST_EMAIL_ADDRESS` is needed for the preview route. The other three are
needed to actually send.

### 2. Start the server

```
yarn start
```

It listens on `PORT` from `.env` (currently `8080`). The examples below assume
that — adjust if you've changed it.

### 3. Preview the HTML

Open it straight in a browser to see it rendered:

```
open 'http://localhost:8080/test/TestBuildTestEmail?type=2'
```

Check both accents while you're there — `type=2` is the amber "Action Required"
treatment, `type=1` the blue "Autonomous Updates" one.

To get the markup itself rather than a rendered page, use `format`:

```
# HTML as text/plain, so the browser shows the source instead of rendering it
curl 'http://localhost:8080/test/TestBuildTestEmail?type=2&format=source'

# both bodies at once, for checking the plaintext alternative too
curl 'http://localhost:8080/test/TestBuildTestEmail?type=2&format=json'

# save it to paste into a preview tool or an email client
curl 'http://localhost:8080/test/TestBuildTestEmail?type=2&format=source' > /tmp/email.html
```

Custom copy, useful for checking how long strings wrap:

```
curl -G 'http://localhost:8080/test/TestBuildTestEmail' \
  --data-urlencode 'type=2' \
  --data-urlencode 'title=Snake Plant needs water' \
  --data-urlencode 'message=It has been 14 days since the last watering.'
```

Worth doing occasionally: pass a title containing `<b>` or `&` and confirm it
comes back escaped rather than rendering as markup. Real plant names are
user-entered, so that path matters.

### 4. Send a real email

```
curl -X POST http://localhost:8080/test/TestSendTestEmail \
  -H 'Content-Type: application/json' \
  -d '{"type":2}'
```

A success looks like:

```json
{
  "message": "Test email sent",
  "to": "you@example.com",
  "notification_type_id": 2,
  "subject": "Monstera Deliciosa needs water"
}
```

and the server log will show the Resend message id, which is what you search on
in the Resend dashboard:

```
[email] Sent notification 0 to user 0 (resend id 01a0c103-…).
```

Remember this spends real quota and puts a real message in a real inbox.

### 5. When it doesn't work

`sendNotificationEmail` swallows its failures by design, so the HTTP response
tells you very little — the `[email]` log lines are where the reason is.

| Symptom                              | Usual cause                                                      |
| ------------------------------------ | ---------------------------------------------------------------- |
| `404` on both routes                 | `NODE_ENV=production`; the routes are hard off there              |
| `400` from the send route            | `TEST_EMAIL_ADDRESS` isn't set                                    |
| `502` + `RESEND_API_KEY is not set`  | Key missing from `.env`, or the server started before you added it |
| `502` + `RESEND_FROM_EMAIL is not set` | From address missing from `.env`                                 |
| `502` + a Resend error object        | Usually a from address on an unverified domain, or a rate limit   |
| `200` but nothing arrives            | Check spam, then the Resend dashboard's delivery log by message id |
| No "View in Planty" link in the mail | `APP_BASE_URL` is unset — this is expected, not a bug             |

The client is memoized after the first send, so if you edit `RESEND_API_KEY` in
`.env`, restart the server — the old key stays cached otherwise.

Both routes are unauthenticated and one of them spends Resend quota, so the
router **always 404s when `NODE_ENV=production`** — there's no flag to turn that
off. `TEST_EMAIL_ADDRESS` belongs in your local `.env` only; it does not need to
exist in Railway. If verifying a production send ever becomes necessary, that's
a deliberate code change rather than a variable someone can flip.

### Checking email without the routes

- With no `RESEND_API_KEY` set, everything runs and logs a warning; no mail is
  sent. This is the normal local default.
- To exercise the real notification path end to end, set
  `enabled_email_notifications = 1` on your test user and create a notification.
- To eyeball a template in a script or test, call `buildNotificationEmailHtml(...)`
  and write the string to an HTML file.
