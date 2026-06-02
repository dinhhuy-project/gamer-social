"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { mapMessageRecordToDto } from "@/lib/services/messages/message.mapper";
import { subscribeToConversationMessages } from "@/lib/realtime/services/message-realtime.service";
import { ensureSupabaseClientSession } from "@/lib/realtime/services/session.service";

export function useConversationRealtime(conversationId?: string) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!conversationId) return;

    let cleanup: (() => void) | null = null;

    const init = async () => {
      const { authUserId, appUserId } = await ensureSupabaseClientSession(supabase);
      // console.log("[realtime] useConversationRealtime session:", { authUserId, appUserId, conversationId });
      if (!authUserId) {
        console.warn("useConversationRealtime: no auth session available, skipping subscription");
        return;
      }
      if (!appUserId) {
        console.warn("useConversationRealtime: auth session found but application user not resolved, skipping subscription");
        return;
      }

      cleanup = subscribeToConversationMessages(supabase, conversationId, (dto) => {
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
      });
    };

    void init();

    return () => {
      if (cleanup) cleanup();
    };
  }, [conversationId, supabase, queryClient]);
}
