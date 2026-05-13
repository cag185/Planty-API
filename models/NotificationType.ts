export interface NotificationType {
  id: number;
  date_created: Date;
  date_deleted: Date | null;
  date_updated: Date;
  name: string;
}
