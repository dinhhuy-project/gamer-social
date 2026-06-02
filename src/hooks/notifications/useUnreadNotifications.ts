"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";

async function fetchUnreadCount() {
  const res = await fetch(`/api/notifications/unread-count`, { credentials: "same-origin" });
  // If user is not authenticated, server returns 401 — treat as 0 unread
  if (res.status === 401) return 0;
  if (!res.ok) throw new Error("Failed to fetch unread notifications");
  const data = await res.json();
  return data?.unread ?? 0;
}

export function useUnreadNotifications(userId?: string) {
  return useQuery<number>({
    queryKey: QUERY_KEYS.notifications.unread(userId ?? "__me__"),
    queryFn: fetchUnreadCount,
    staleTime: 30_000,
    enabled: Boolean(userId),
  });
}
