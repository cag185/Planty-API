export interface User {
  id: number;
  date_created: Date;
  date_deleted: Date | null;
  date_updated: Date;
  name: string;
  email: string;
  password: string;
  // Stored as a tinyint(1) in MySQL, so this arrives as 0/1 rather than a real boolean.
  enabled_email_notifications: boolean;
}
