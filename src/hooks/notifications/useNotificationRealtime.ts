"use client";

import { useNotificationsRealtime } from "@/lib/realtime/hooks/useNotificationsRealtime";

export function useNotificationRealtime(userId?: string) {
  return useNotificationsRealtime(userId);
}
