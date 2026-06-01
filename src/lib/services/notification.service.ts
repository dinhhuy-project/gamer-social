import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Prisma, notification_type } from "@/generated/prisma/client";
import { NotificationRealtimeService } from "./realtime";

type NotificationRecordInput = {
  userId: string;
  type: notification_type;
  title: string | null;
  body?: string | null;
  data?: unknown;
};

type NotificationRecordResult = {
  id: string;
  userId: string;
  type: string;
  title: string | null;
  body: string | null;
};

export async function createNotifications(
  tx: Prisma.TransactionClient,
  entries: NotificationRecordInput[]
) {
  const notifications: NotificationRecordResult[] = [];

  for (const entry of entries) {
    const notification = await tx.notifications.create({
      data: {
        user_id: entry.userId,
        type: entry.type,
        title: entry.title,
        body: entry.body ?? null,
        data: entry.data ?? undefined,
      },
    });

    notifications.push({
      id: notification.id,
      userId: entry.userId,
      type: entry.type,
      title: notification.title,
      body: notification.body ?? null,
    });
  }

  return notifications;
}

export async function broadcastNotifications(
  notifications: NotificationRecordResult[]
) {
  await Promise.all(
    notifications.map(async (notification) => {
      try {
        await NotificationRealtimeService.send(supabaseAdmin, notification.userId, {
          notificationId: notification.id,
          type: notification.type,
          title: notification.title ?? "",
          body: notification.body ?? undefined,
        });
      } catch {
        // ignore realtime failures
      }
    })
  );
}
