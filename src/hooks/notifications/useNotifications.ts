"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/api-client";

async function fetchNotifications(userId: string | undefined, page = 1, perPage = 20, signal?: AbortSignal) {
  if (!userId) throw new Error("Missing userId");
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));

  return apiClient(`/api/notifications?${params.toString()}`, { credentials: "same-origin" }, signal);
}

export function useNotifications(userId?: string, page = 1, perPage = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.list(userId ?? "__me__"),
    queryFn: ({ signal }) => fetchNotifications(userId, page, perPage, signal),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}
