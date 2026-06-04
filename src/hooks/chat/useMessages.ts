"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types/api.types";
import type { MessageDto } from "@/types/message.types";
import { apiClient } from "@/lib/api/api-client";

async function fetchMessages(
  conversationId: string,
  page: number,
  perPage: number,
  signal?: AbortSignal
) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  return apiClient<PaginatedResponse<MessageDto>>(`/api/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`, { credentials: "same-origin" }, signal);
}

export function useMessages(
  conversationId: string | undefined,
  page = 1,
  perPage = 50
) {
  return useQuery<PaginatedResponse<MessageDto>, Error>({
    queryKey: ["messages", conversationId ?? "", page, perPage],
    queryFn: ({ signal }) => fetchMessages(conversationId!, page, perPage, signal),
    enabled: Boolean(conversationId),
    placeholderData: keepPreviousData,
  });
}
