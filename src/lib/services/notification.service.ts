import { prisma } from "@/lib/prisma";

import type { Prisma } from "@/generated/prisma/client";
import type { notification_type } from "@/generated/prisma/enums";

export type CreateNotificationInput = {
  userId: string;
  type: notification_type;
  title?: string | null;
  body?: string | null;
  data?: Record<string, unknown> | null;
};

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notifications.create({
    data: {
      user_id: input.userId,
      type: input.type,
      title: input.title ?? null,
      body: input.body ?? null,
      data: input.data ? (input.data as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function createListingReviewNotification(input: {
  userId: string;
  postId: string;
  approved: boolean;
  rejectReason?: string | null;
}) {
  return createNotification({
    userId: input.userId,
    type: input.approved ? "listing_approved" : "listing_rejected",
    title: input.approved ? "Listing approved" : "Listing rejected",
    body: input.approved
      ? "Your marketplace listing has been approved."
      : "Your marketplace listing was rejected.",
    data: {
      postId: input.postId,
      ...(input.rejectReason ? { reason: input.rejectReason } : {}),
    },
  });
}

export const notificationService = {
  createNotification,
  createListingReviewNotification,
};
