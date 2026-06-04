"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/api-client";
import type { PaginatedResponse } from "@/types/api.types";
import type { NotificationDto } from "@/types/notification.types";

async function fetchNotifications(
  userId: string | undefined,
  page = 1,
  perPage = 20,
  signal?: AbortSignal
): Promise<PaginatedResponse<NotificationDto>> {
  if (!userId) throw new Error("Missing userId");
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));

  return apiClient<PaginatedResponse<NotificationDto>>(`/api/notifications?${params.toString()}`, { credentials: "same-origin" }, signal);
}

export function useNotifications(userId?: string, page = 1, perPage = 20) {
  return useQuery<PaginatedResponse<NotificationDto>, Error>({
    queryKey: QUERY_KEYS.notifications.list(userId ?? "__me__"),
    queryFn: ({ signal }) => fetchNotifications(userId, page, perPage, signal),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
  });
}
