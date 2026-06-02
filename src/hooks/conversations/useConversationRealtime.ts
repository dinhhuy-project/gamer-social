"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { mapMessageRecordToDto } from "@/lib/services/messages/message.mapper";

export function useConversationRealtime(conversationId?: string) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!conversationId) return;

    const filter = `conversation_id=eq.${conversationId}`;
    const channel = supabase
      .channel("public:messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter }, (payload) => {
        const newRow = (payload as any)?.new;
        if (!newRow) return;
        const dto = mapMessageRecordToDto(newRow);

        // Update conversation detail cache
        queryClient.setQueryData(QUERY_KEYS.conversation(conversationId), (old: any) => {
          if (!old) return old;
          return { ...old, latestMessage: dto, updatedAt: dto.sentAt };
        });

        // Update conversation lists ordering
        const convQueries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.conversations.root(), exact: false });
        for (const [key] of convQueries) {
          queryClient.setQueryData(key, (prev: any) => {
            if (!prev || !Array.isArray(prev.data)) return prev;
            const idx = prev.data.findIndex((c: any) => c.id === dto.conversationId);
            if (idx === -1) return prev;
            const updated = [...prev.data];
            const conv = { ...updated[idx], latestMessage: dto, updatedAt: dto.sentAt };
            updated.splice(idx, 1);
            updated.unshift(conv);
            return { ...prev, data: updated };
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, queryClient]);
}
