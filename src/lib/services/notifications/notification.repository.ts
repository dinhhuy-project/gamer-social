import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { NotificationCreateInput, NotificationDto } from "@/types/notification.types";
import { mapNotificationRecordToDto } from "./notification.mapper";

export async function createNotificationsTx(
  tx: Prisma.TransactionClient,
  entries: NotificationCreateInput[],
  options?: { actorId?: string }
): Promise<NotificationDto[]> {
  const out: NotificationDto[] = [];

  if (!entries || entries.length === 0) return out;

  // dedupe similar entries
  const map = new Map<string, NotificationCreateInput>();
  for (const e of entries) {
    const key = `${e.userId}|${e.type}|${JSON.stringify(e.data ?? {})}`;
    if (!map.has(key)) {
      map.set(key, { ...e });
      continue;
    }
    const existing = map.get(key)!;
    const actor = (e.data as any)?.actorId;
    if (actor) {
      const existingActors = new Set(((existing.data as any)?.actors || []) as string[]);
      existingActors.add(actor);
      existing.data = { ...(existing.data ?? {}), actors: Array.from(existingActors) };
    }
    existing.title = existing.title ?? e.title ?? null;
    existing.body = existing.body ?? e.body ?? null;
    map.set(key, existing);
  }

  const normalized = Array.from(map.values()).filter((e) => !(options?.actorId && options.actorId === e.userId));
  if (normalized.length === 0) return out;

  const userIds = Array.from(new Set(normalized.map((e) => e.userId)));
  const existingUsers = await tx.users.findMany({ where: { id: { in: userIds } }, select: { id: true } });
  const existingSet = new Set(existingUsers.map((u) => u.id));

  const toCreate = normalized.filter((e) => existingSet.has(e.userId));
  for (const entry of toCreate) {
    const created = await tx.notifications.create({
      data: {
        user_id: entry.userId,
        type: entry.type as any,
        title: entry.title ?? null,
        body: entry.body ?? null,
        data: entry.data ?? undefined,
      },
    });

    out.push(mapNotificationRecordToDto(created));
  }

  return out;
}

export async function listNotifications(userId: string, page = 1, perPage = 20) {
  const take = Math.max(1, Math.min(200, perPage));
  const skip = Math.max(0, (page - 1) * take);

  const [total, rows] = await prisma.$transaction([
    prisma.notifications.count({ where: { user_id: userId } }),
    prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      skip,
      take,
    }),
  ]);

  return {
    data: rows.map(mapNotificationRecordToDto),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / take)),
    hasMore: page * take < total,
  };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const updated = await prisma.notifications.updateMany({
    where: { id: notificationId, user_id: userId },
    data: { is_read: true },
  });

  return updated.count > 0;
}

export async function markAllNotificationsRead(userId: string) {
  const updated = await prisma.notifications.updateMany({ where: { user_id: userId, is_read: false }, data: { is_read: true } });
  return updated.count;
}
