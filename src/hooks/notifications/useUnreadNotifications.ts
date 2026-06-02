"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";

async function fetchUnreadCount() {
  const res = await fetch(`/api/notifications/unread-count`, { credentials: "same-origin" });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch unread notifications");
  const data = await res.json();
  return data?.unread ?? 0;
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.unread("__me__"),
    queryFn: fetchUnreadCount,
    staleTime: 30_000,
  });
}
