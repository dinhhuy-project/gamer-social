"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeToMessages } from "@/lib/realtime/services/message-realtime.service";
import { ensureSupabaseClientSession } from "@/lib/realtime/services/session.service";
import { QUERY_KEYS } from "@/lib/queryKeys";

export function useMessagesRealtime(): void {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const init = async () => {
      const { authUserId, appUserId } = await ensureSupabaseClientSession(supabase);
      // console.log("[realtime] useMessagesRealtime session:", { authUserId, appUserId });
      // Require both an auth session and an application user id before subscribing
      if (!authUserId) {
        console.warn("useMessagesRealtime: no auth session available, skipping subscription");
        return;
      }
      if (!appUserId) {
        console.warn("useMessagesRealtime: auth session found but application user not resolved, skipping subscription");
        return;
      }

      cleanup = subscribeToMessages(supabase, (dto) => {
        try {
          // Update conversation lists: move conversation to top and set latestMessage
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

          // Increment unread counts only when sender is not the current user
          try {
            const currentUserId = appUserId;
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
          } catch {
            // ignore
          }
        } catch (err) {
          console.error("useMessagesRealtime: error handling incoming message", err);
        }
      });
    };

    void init();

    return () => {
      if (cleanup) cleanup();
    };
  }, [queryClient, supabase]);
}

export default useMessagesRealtime;
