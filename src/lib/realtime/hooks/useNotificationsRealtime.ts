"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeToNotifications } from "@/lib/realtime/services/notification-realtime.service";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { mapNotificationRecordToDto } from "@/lib/services/notifications/notification.mapper";

export function useNotificationsRealtime(userId?: string) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!userId) return;

    let cleanup: (() => void) | null = null;
    let isMounted = true;

    const unsubscribe = subscribeToNotifications(supabase, userId, (dto: any) => {
      try {
        // update notifications list cache
        const notifQueries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.notifications.root(userId), exact: false });
        for (const [key] of notifQueries) {
          queryClient.setQueryData(key, (prev: any) => {
            if (!prev) return prev;
            if (Array.isArray(prev?.data)) {
              return { ...prev, data: [dto, ...prev.data] };
            }
            return prev;
          });
        }

        // increment unread notifications count cache (if present)
        try {
          queryClient.setQueryData(QUERY_KEYS.notifications.unread(userId), (old: number | undefined) => {
            return (old ?? 0) + 1;
          });
        } catch (e) {
          // ignore if cache key not present
        }

        // if this notification references a conversation, update conversation ordering + latest message placeholder
        const conversationId = dto.data?.conversationId ?? dto.data?.conversation_id;
        if (conversationId) {
          const convQueries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.conversations.root(), exact: false });
          for (const [key] of convQueries) {
            queryClient.setQueryData(key, (prev: any) => {
              if (!prev || !Array.isArray(prev.data)) return prev;
              const idx = prev.data.findIndex((c: any) => c.id === conversationId);
              if (idx === -1) return prev;
              const updated = [...prev.data];
              const conv = { ...updated[idx] };
              conv.latestMessage = conv.latestMessage ?? { id: dto.data?.messageId ?? dto.id, conversationId, senderId: dto.data?.actorId ?? null, content: dto.body ?? null, mediaUrls: [], sentAt: dto.createdAt ?? new Date().toISOString() };
              updated.splice(idx, 1);
              updated.unshift(conv);
              return { ...prev, data: updated };
            });
          }
        }
      } catch (err) {
        console.error("useNotificationsRealtime: error handling incoming notification", err);
      }
    });

    if (!isMounted) {
      unsubscribe();
    } else {
      cleanup = unsubscribe;
    }

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, [userId, supabase, queryClient]);
}

export default useNotificationsRealtime;
