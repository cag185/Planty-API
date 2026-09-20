-- ADD THE EMAIL NOTIFICATION OPT-IN COLUMN TO USERS
--
-- Users are opted out by default; they turn this on from the settings page,
-- which is what notificationService checks before emailing a new notification.
--
-- Guarded so this is safe to re-run against a database that already has the
-- column (MySQL has no ADD COLUMN IF NOT EXISTS). On a database that already
-- has it, this is a no-op.
SET
    @column_exists = (
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE
            TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'users_user'
            AND COLUMN_NAME = 'enabled_email_notifications'
    );

SET
    @sql = IF(
        @column_exists = 0,
        'ALTER TABLE users_user ADD COLUMN enabled_email_notifications BOOLEAN NOT NULL DEFAULT FALSE',
        'SELECT ''enabled_email_notifications already exists – nothing to do'' AS result'
    );

PREPARE stmt FROM @sql;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;
