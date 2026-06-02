"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";

async function fetchNotifications(userId: string | undefined, page = 1, perPage = 20) {
  if (!userId) throw new Error("Missing userId");
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));

  const res = await fetch(`/api/notifications?${params.toString()}`, { credentials: "same-origin" });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export function useNotifications(userId?: string, page = 1, perPage = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.list(userId ?? "__me__"),
    queryFn: () => fetchNotifications(userId, page, perPage),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}
