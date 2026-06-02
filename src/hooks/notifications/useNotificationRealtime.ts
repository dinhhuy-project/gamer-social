"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { mapNotificationRecordToDto } from "@/lib/services/notifications/notification.mapper";

export function useNotificationRealtime(userId?: string) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!userId) return;

    const filter = `user_id=eq.${userId}`;
    const channel = supabase
      .channel("public:notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter }, (payload) => {
        const newRow = (payload as any)?.new;
        if (!newRow) return;
        const dto = mapNotificationRecordToDto(newRow);

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
              // set latestMessage placeholder from notification; UI can fetch full message if needed
              conv.latestMessage = conv.latestMessage ?? { id: dto.data?.messageId ?? dto.id, conversationId, senderId: dto.data?.actorId ?? null, content: dto.body ?? null, mediaUrls: [], sentAt: dto.createdAt ?? new Date().toISOString() };
              // move to top
              updated.splice(idx, 1);
              updated.unshift(conv);
              return { ...prev, data: updated };
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, queryClient]);
}
