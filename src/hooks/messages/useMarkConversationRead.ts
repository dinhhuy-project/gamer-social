"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";

async function postMarkRead(conversationId: string) {
  // Feature disabled: do not call server, return neutral value
  return { totalUnreadCount: 0 };
}

export function useMarkConversationRead() {
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: postMarkRead,
    onMutate: async (conversationId: string) => {
      await qc.cancelQueries({ queryKey: QUERY_KEYS.unread.total() });

      const prevTotal = qc.getQueryData<number>(QUERY_KEYS.unread.total());
      const prevConversation = qc.getQueryData<number>(QUERY_KEYS.unread.conversation(conversationId));

      // optimistic: set conversation unread to 0 and decrement total
      qc.setQueryData(QUERY_KEYS.unread.conversation(conversationId), 0);
      qc.setQueryData(QUERY_KEYS.unread.total(), (old: number | undefined) => {
        const diff = prevConversation ?? 0;
        return Math.max(0, (old ?? 0) - diff);
      });

      return { prevTotal, prevConversation };
    },
    onError: (_err, conversationId, ctx: any) => {
      if (ctx?.prevTotal !== undefined) qc.setQueryData(QUERY_KEYS.unread.total(), ctx.prevTotal);
      if (ctx?.prevConversation !== undefined) qc.setQueryData(QUERY_KEYS.unread.conversation(conversationId), ctx.prevConversation);
    },
    onSuccess: (data: any, conversationId: string) => {
      // server may return authoritative total
      if (data?.totalUnreadCount !== undefined) qc.setQueryData(QUERY_KEYS.unread.total(), data.totalUnreadCount);
      qc.setQueryData(QUERY_KEYS.unread.conversation(conversationId), 0);
    },
  });

  return {
    markConversationRead: m.mutateAsync,
    isMarking: m.status === "pending",
    error: m.error,
  };
}
