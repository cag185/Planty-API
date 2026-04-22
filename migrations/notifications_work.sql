-- CREATE THE NEW NOTIFICATIONS_TYPES TABLE
CREATE TABLE notifications_types (
    id int NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT 'Primary Key',
    date_created DATETIME COMMENT 'Date Created' DEFAULT CURRENT_TIMESTAMP,
    date_deleted DATETIME COMMENT 'Date Deleted',
    date_updated DATETIME COMMENT 'Date Updated' DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    name VARCHAR(255)
) COMMENT '';

-- SEED THE NOTIFICATIONS_TYPES TABLE
INSERT INTO
    notifications_types (name)
VALUES ('update'),
    ('requirement');

-- CREATE THE NOTIFICATIONS TABLE
CREATE TABLE notifications_notification (
    id int NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT 'Primary Key',
    date_created DATETIME COMMENT 'Date Created' DEFAULT CURRENT_TIMESTAMP,
    date_deleted DATETIME COMMENT 'Date Deleted',
    date_updated DATETIME COMMENT 'Date Updated' DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notification_type_id int,
    users_user_id int,
    plant_id int,
    title VARCHAR(255) COMMENT 'Title',
    message VARCHAR(255) COMMENT 'Message',
    date_acknowledged DATETIME COMMENT 'Date Acknowledged',
    date_completed DATETIME COMMENT 'Date Completed',
    acknowledged BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (notification_type_id) REFERENCES notifications_types (id),
    FOREIGN KEY (users_user_id) REFERENCES users_user (id),
    FOREIGN KEY (plant_id) REFERENCES plants_plant (id)
) COMMENT '';

-- -- alter the table to get the missing proprties
-- ALTER TABLE notifications_notification
-- ADD COLUMN title VARCHAR(255) COMMENT 'Title',
-- ADD COLUMN message VARCHAR(255) COMMENT 'Message'

-- -- SEED THE NOTIFICATIONS TABLE
-- INSERT INTO
--     notifications_notification (
--         notification_type_id,
--         users_user_id,
--         plant_id,
--         message,
--         title
--     )
-- values (
--         1,
--         3,
--         10,
--         'Your plant needs water',
--         'Water your plant'
--     )