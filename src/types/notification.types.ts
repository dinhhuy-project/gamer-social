import type { notification_type } from "@/generated/prisma/client";

export type NotificationCreateInput = {
  userId: string;
  type: notification_type | string;
  title?: string | null;
  body?: string | null;
  data?: Record<string, any> | null;
};

export type NotificationDto = {
  id: string;
  userId: string;
  type: notification_type | string;
  title: string | null;
  body: string | null;
  data?: any;
  createdAt?: string | null;
  isRead?: boolean;
};

export { };
