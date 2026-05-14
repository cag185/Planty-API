import { Notification } from "../models";
import { CreateNotificationRequest, CompleteNotificationRequest, CompleteAllNotificationsRequest, AcknowledgeNotificationRequest, AcknowledgeAllNotificationsRequest } from "../requests";
export declare const getNotificationsByUserId: (userId: number) => Promise<Notification[]>;
export declare const createNotification: (req: CreateNotificationRequest) => Promise<Notification>;
export declare const completeNotification: (req: CompleteNotificationRequest) => Promise<boolean>;
export declare const completeAllNotifications: (req: CompleteAllNotificationsRequest) => Promise<boolean>;
export declare const acknowledgeNotification: (req: AcknowledgeNotificationRequest) => Promise<boolean>;
export declare const acknowledgeAllNotifications: (req: AcknowledgeAllNotificationsRequest) => Promise<boolean>;
