import { createNotificationsTx, listNotifications, markNotificationRead, markAllNotificationsRead } from "./notification.repository";
import type { NotificationCreateInput } from "@/types/notification.types";
import { prisma } from "@/lib/prisma";

export async function createNotifications(tx: any, entries: NotificationCreateInput[], options?: { actorId?: string }) {
  return createNotificationsTx(tx, entries, options);
}

export async function getNotifications(userId: string, page = 1, perPage = 20) {
  return listNotifications(userId, page, perPage);
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
  markAsRead,
  markAllRead,
};

export default notificationService;
