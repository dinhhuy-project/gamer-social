"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";

async function fetchConversationUnread(conversationId: string) {
  const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/unread`, { credentials: "same-origin" });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? "Failed to get unread count");
  }

  const data = await res.json();
  return data?.unread ?? 0;
}

export function useUnreadConversationCount(conversationId?: string) {
  return useQuery<number, Error>({
    queryKey: conversationId ? QUERY_KEYS.unread.conversation(conversationId) : ["unread", "conversation", ""],
    queryFn: () => fetchConversationUnread(conversationId!),
    enabled: Boolean(conversationId),
    staleTime: 1000 * 60 * 5,
  });
}
