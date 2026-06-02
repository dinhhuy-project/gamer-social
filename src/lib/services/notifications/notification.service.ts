import { createNotificationsTx, listNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount as getUnreadCountRepo } from "./notification.repository";
import type { NotificationCreateInput } from "@/types/notification.types";

export async function createNotifications(tx: any, entries: NotificationCreateInput[], options?: { actorId?: string }) {
  return createNotificationsTx(tx, entries, options);
}

export async function getNotifications(userId: string, page = 1, perPage = 20) {
  return listNotifications(userId, page, perPage);
}

export async function getUnreadCount(userId: string) {
  return getUnreadCountRepo(userId);
}

export async function markAsRead(notificationId: string, userId: string) {
  return markNotificationRead(notificationId, userId);
}

export async function markAllRead(userId: string) {
  return markAllNotificationsRead(userId);
}

export const notificationService = {
  createNotifications,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
};

export default notificationService;
