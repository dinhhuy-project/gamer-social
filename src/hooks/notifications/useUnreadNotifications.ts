"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/api-client";

async function fetchUnreadCount(signal?: AbortSignal) {
  try {
    const data = await apiClient<{ unread?: number }>(`/api/notifications/unread-count`, { credentials: "same-origin" }, signal);
    return data?.unread ?? 0;
  } catch (err: any) {
    if (err?.status === 401) return 0;
    throw err;
  }
}

export function useUnreadNotifications(userId?: string) {
  return useQuery<number>({
    queryKey: QUERY_KEYS.notifications.unread(userId ?? "__me__"),
    queryFn: ({ signal }) => fetchUnreadCount(signal),
    staleTime: 30_000,
    enabled: Boolean(userId),
  });
}
