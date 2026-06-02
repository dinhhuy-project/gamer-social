"use client";

import { useNotificationRealtime } from "./useNotificationRealtime";

export function useRealtimeNotifications(userId?: string) {
  useNotificationRealtime(userId);
}
