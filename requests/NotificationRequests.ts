export interface CreateNotificationRequest {
  title: string;
  message: string;
  users_user_id: number;
  plant_id: number;
  notification_type_id: number;
}

export interface CompleteNotificationRequest {
  notification_id: number;
}

export interface CompleteAllNotificationsRequest {
  user_id: number;
}

export interface AcknowledgeNotificationRequest {
  notification_id: number;
}

export interface AcknowledgeAllNotificationsRequest {
  user_id: number;
}
