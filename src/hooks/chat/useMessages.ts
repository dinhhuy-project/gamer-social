"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types/api.types";
import type { MessageDto } from "@/types/message.types";

async function fetchMessages(
  conversationId: string,
  page: number,
  perPage: number
) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));

  const res = await fetch(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`,
    {
      credentials: "same-origin",
    }
  );

  if (res.status === 401) {
    throw new Error("Unauthorized");
  }
  if (res.status === 404) {
    throw new Error("Conversation not found");
  }
  if (!res.ok) {
    throw new Error("Failed to fetch messages");
  }

  return (await res.json()) as PaginatedResponse<MessageDto>;
}

export function useMessages(
  conversationId: string | undefined,
  page = 1,
  perPage = 50
) {
  return useQuery<PaginatedResponse<MessageDto>, Error>({
    queryKey: ["messages", conversationId ?? "", page, perPage],
    queryFn: () => fetchMessages(conversationId!, page, perPage),
    enabled: Boolean(conversationId),
    placeholderData: keepPreviousData,
  });
}
