"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types/api.types";
import type { ConversationDto } from "@/types/conversation.types";

async function fetchConversations(page: number, perPage: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));

  const res = await fetch(`/api/conversations?${params.toString()}`, {
    credentials: "same-origin",
  });

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return (await res.json()) as PaginatedResponse<ConversationDto>;
}

export function useConversations(page = 1, perPage = 20) {
  return useQuery<PaginatedResponse<ConversationDto>, Error>({
    queryKey: ["conversations", page, perPage],
    queryFn: () => fetchConversations(page, perPage),
    placeholderData: keepPreviousData,
  });
}
