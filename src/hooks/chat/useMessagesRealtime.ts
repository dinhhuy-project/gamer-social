"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { mapMessageRecordToDto } from "@/lib/services/messages/message.mapper";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { useAuth } from "@/providers/AuthProvider";

export function useMessagesRealtime() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);
  const { profile } = useAuth();

  useEffect(() => {
    const channel = supabase
      .channel("public:messages-all")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newRow = (payload as any)?.new;
        if (!newRow) return;
        const dto = mapMessageRecordToDto(newRow);

        // bump conversation ordering + latest message
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

        // update unread counts for current user
        try {
          const currentUserId = profile?.id;
          if (currentUserId && dto.senderId !== currentUserId) {
            queryClient.setQueryData(QUERY_KEYS.unread.conversation(dto.conversationId), (old: any) => {
              const prev = typeof old === "number" ? old : Number(old ?? 0);
              return prev + 1;
            });

            queryClient.setQueryData(QUERY_KEYS.unread.total(), (old: any) => {
              const prev = typeof old === "number" ? old : Number(old ?? 0);
              return prev + 1;
            });
          }
        } catch (e) {
          // ignore
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase, profile]);
}

export default useMessagesRealtime;
