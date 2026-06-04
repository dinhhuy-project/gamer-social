"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";

async function fetchConversationUnread(_conversationId: string, _signal?: AbortSignal) {
  // Feature disabled: always return 0 without network requests
  return 0;
}

export function useUnreadConversationCount(conversationId?: string) {
  return useQuery<number, Error>({
    queryKey: conversationId ? QUERY_KEYS.unread.conversation(conversationId) : ["unread", "conversation", ""],
    queryFn: ({ signal }) => fetchConversationUnread(conversationId!, signal),
    enabled: Boolean(conversationId),
    staleTime: 1000 * 60 * 5,
  });
}
