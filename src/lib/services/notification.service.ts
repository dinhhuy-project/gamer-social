import { supabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import type { Prisma, notification_type } from "@/generated/prisma/client";
import { NotificationRealtimeService } from "./realtime";
import type {
  NotificationCreateInput,
  NotificationDto,
} from "@/types/notification.types";

function dedupeEntries(entries: NotificationCreateInput[]) {
  const map = new Map<string, NotificationCreateInput>();

  for (const e of entries) {
    const key = `${e.userId}|${e.type}|${JSON.stringify(e.data ?? {})}`;
    if (!map.has(key)) {
      map.set(key, { ...e });
      continue;
    }

    const existing = map.get(key)!;
    // aggregate actors if provided in data
    const actor = (e.data as any)?.actorId;
    if (actor) {
      const existingActors = new Set(((existing.data as any)?.actors || []) as string[]);
      existingActors.add(actor);
      existing.data = { ...(existing.data ?? {}), actors: Array.from(existingActors) };
    }

    // prefer non-null title/body from entries
    existing.title = existing.title ?? e.title ?? null;
    existing.body = existing.body ?? e.body ?? null;
    map.set(key, existing);
  }

  return Array.from(map.values());
}

export async function createNotifications(
  tx: Prisma.TransactionClient,
  entries: NotificationCreateInput[],
  options?: { actorId?: string }
): Promise<NotificationDto[]> {
  const out: NotificationDto[] = [];

  if (!entries || entries.length === 0) return out;

  const normalized = dedupeEntries(entries || []);

  // filter self-notifications
  const filtered = normalized.filter((e) => !(options?.actorId && options.actorId === e.userId));

  if (filtered.length === 0) return out;

  // pre-check recipients exist to avoid creating notifications for unknown users
  const userIds = Array.from(new Set(filtered.map((e) => e.userId)));
  const existingUsers = await tx.users.findMany({ where: { id: { in: userIds } }, select: { id: true } });
  const existingSet = new Set(existingUsers.map((u) => u.id));

  const toCreate = filtered.filter((e) => existingSet.has(e.userId));

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

    out.push({
      id: created.id,
      userId: created.user_id,
      type: created.type as string,
      title: created.title ?? null,
      body: created.body ?? null,
      data: created.data ?? undefined,
      createdAt: created.created_at?.toISOString(),
    });
  }

  return out;
}

export async function broadcastNotifications(notifications: NotificationDto[]) {
  if (!notifications || notifications.length === 0) return;

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
        // ignore realtime failures — do not fail callers for broadcast issues
      }
    })
  );
}

export async function createAndBroadcast(
  entries: NotificationCreateInput[],
  options?: { actorId?: string }
) {
  if (!entries || entries.length === 0) return [] as NotificationDto[];

  const created = await prisma.$transaction(async (tx) => {
    return createNotifications(tx, entries, options);
  });

  try {
    await broadcastNotifications(created);
  } catch {
    // broadcast errors are non-fatal
  }

  return created;
}

export async function notify(
  event: notification_type | string,
  payload: Record<string, any>,
  options?: { actorId?: string }
) {
  // map event -> notification entries
  const entries: NotificationCreateInput[] = [];

  switch (event) {
    case "post_reaction": {
      const postId = payload.postId ?? payload.post_id;
      if (!postId) break;
      const post = await prisma.posts.findUnique({ where: { id: postId } });
      if (!post) break;
      if (post.user_id === options?.actorId) break;
      entries.push({
        userId: post.user_id,
        type: "post_reaction",
        title: "New reaction",
        body: payload.summary ?? null,
        data: { postId, actorId: options?.actorId ?? payload.actorId },
      });
      break;
    }

    case "post_comment": {
      const postId = payload.postId ?? payload.post_id;
      if (!postId) break;
      const post = await prisma.posts.findUnique({ where: { id: postId } });
      if (!post) break;
      if (post.user_id === options?.actorId) break;
      entries.push({
        userId: post.user_id,
        type: "post_comment",
        title: "New comment",
        body: payload.summary ?? null,
        data: { postId, commentId: payload.commentId, actorId: options?.actorId ?? payload.actorId },
      });
      break;
    }

    case "comment_reply": {
      const parentId = payload.parentCommentId ?? payload.parent_id ?? payload.commentId;
      if (!parentId) break;
      const parent = await prisma.comments.findUnique({ where: { id: parentId } });
      if (!parent) break;
      if (parent.user_id === options?.actorId) break;
      entries.push({
        userId: parent.user_id,
        type: "comment_reply",
        title: "Reply to your comment",
        body: payload.summary ?? null,
        data: { parentId, replyId: payload.replyId, actorId: options?.actorId ?? payload.actorId },
      });
      break;
    }

    case "new_follower": {
      const target = payload.targetUserId ?? payload.target_user_id;
      if (!target) break;
      if (target === options?.actorId) break;
      entries.push({
        userId: target,
        type: "new_follower",
        title: "New follower",
        body: payload.summary ?? null,
        data: { followerId: options?.actorId ?? payload.followerId },
      });
      break;
    }

    case "new_message": {
      const conversationId = payload.conversationId ?? payload.conversation_id;
      if (!conversationId) break;
      const conversation = await prisma.conversations.findUnique({
        where: { id: conversationId },
        include: { conversation_participants: true },
      });
      if (!conversation) break;
      const participants = conversation.conversation_participants.map((p: any) => p.user_id);
      for (const participantId of participants) {
        if (participantId === options?.actorId) continue;
        entries.push({
          userId: participantId,
          type: "new_message",
          title: "New message",
          body: payload.summary ?? null,
          data: { conversationId, messageId: payload.messageId, actorId: options?.actorId ?? payload.actorId },
        });
      }
      break;
    }

    case "listing_approved":
    case "listing_rejected": {
      const listingId = payload.listingId ?? payload.listing_id;
      if (!listingId) break;
      const listing = await prisma.posts.findUnique({ where: { id: listingId } });
      if (!listing) break;
      if (listing.user_id === options?.actorId) break;
      entries.push({
        userId: listing.user_id,
        type: event as any,
        title: payload.title ?? null,
        body: payload.summary ?? null,
        data: { listingId, actorId: options?.actorId ?? payload.actorId },
      });
      break;
    }

    case "tx_both_confirmed":
    case "tx_admin_joined":
    case "tx_completed":
    case "tx_cancelled": {
      // conversation/trade events: payload.conversationId
      const conversationId = payload.conversationId ?? payload.conversation_id;
      if (!conversationId) break;
      const conv = await prisma.conversations.findUnique({ where: { id: conversationId } });
      if (!conv) break;
      const recipients = [conv.tx_buyer_id, conv.tx_seller_id].filter(Boolean) as string[];
      for (const rid of recipients) {
        if (rid === options?.actorId) continue;
        entries.push({
          userId: rid,
          type: event as any,
          title: payload.title ?? null,
          body: payload.summary ?? null,
          data: { conversationId, actorId: options?.actorId ?? payload.actorId },
        });
      }
      break;
    }

    case "membership_activated":
    case "membership_expiring": {
      const userId = payload.userId ?? payload.user_id;
      if (!userId) break;
      if (userId === options?.actorId) break;
      entries.push({
        userId,
        type: event as any,
        title: payload.title ?? null,
        body: payload.summary ?? null,
        data: { actorId: options?.actorId ?? payload.actorId },
      });
      break;
    }

    default:
      // Unknown event: no-op
      break;
  }

  if (entries.length === 0) return [] as NotificationDto[];

  const created = await prisma.$transaction(async (tx) => {
    return createNotifications(tx, entries, options);
  });

  try {
    await broadcastNotifications(created);
  } catch {
    // ignore broadcast failures
  }

  return created;
}

async function createNotificationsWrapper(
  arg1: any,
  arg2?: any,
  arg3?: any
) {
  // signature: (tx, entries, options?)
  if (arg2 !== undefined) {
    return createNotifications(arg1 as Prisma.TransactionClient, arg2 as NotificationCreateInput[], arg3);
  }

  // signature: (entries[]) -> createAndBroadcast
  if (Array.isArray(arg1)) {
    return createAndBroadcast(arg1 as NotificationCreateInput[], arg2);
  }

  // admin-style single payload: { userId, postId, approved, rejectReason }
  if (arg1 && typeof arg1 === "object") {
    const payload = arg1 as Record<string, any>;
    if ((payload.postId || payload.post_id) && typeof payload.approved !== "undefined") {
      const event = payload.approved ? "listing_approved" : "listing_rejected";
      const entry: NotificationCreateInput = {
        userId: payload.userId,
        type: event,
        title: payload.title ?? (payload.approved ? "Listing approved" : "Listing rejected"),
        body: payload.rejectReason ?? payload.summary ?? null,
        data: payload,
      };

      return createAndBroadcast([entry], { actorId: payload.actorId });
    }

    if (payload.type) {
      // generic — proxy to notify
      return notify(payload.type, payload, { actorId: payload.actorId });
    }

    return [] as NotificationDto[];
  }

  return [] as NotificationDto[];
}

export const notificationService = {
  createNotifications: createNotificationsWrapper,
  broadcastNotifications,
  createAndBroadcast,
  notify,
};

export default notificationService;