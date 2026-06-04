"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types/api.types";
import type { ConversationDto } from "@/types/conversation.types";
import { apiClient } from "@/lib/api/api-client";

async function fetchConversations(page: number, perPage: number, signal?: AbortSignal) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  return apiClient<PaginatedResponse<ConversationDto>>(`/api/conversations?${params.toString()}`, { credentials: "same-origin" }, signal);
}

export function useConversations(page = 1, perPage = 20) {
  return useQuery<PaginatedResponse<ConversationDto>, Error>({
    queryKey: ["conversations", page, perPage],
    queryFn: ({ signal }) => fetchConversations(page, perPage, signal),
    placeholderData: keepPreviousData,
  });
}
