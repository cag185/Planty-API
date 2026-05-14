export interface NotificationType {
  id: number;
  date_created: Date;
  date_deleted: Date | null;
  date_updated: Date;
  name: string;
}

// Type 1 - update
// Type 2 - requirement reminder
