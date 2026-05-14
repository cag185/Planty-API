export interface Notification {
  id: number;
  date_created: Date;
  date_deleted: Date | null;
  date_updated: Date;
  notification_type_id: number;
  users_user_id: number;
  plant_id: number;
  title: string;
  message: string;
  date_acknowledged: Date | null;
  date_completed: Date | null;
  acknowledged: boolean;
  completed: boolean;
}
