"use client";

import { useNotificationRealtime as useNotificationRealtimeLib } from "@/lib/realtime/hooks/useNotificationsRealtime";

export function useNotificationRealtime(userId?: string) {
  return useNotificationRealtimeLib(userId);
}
