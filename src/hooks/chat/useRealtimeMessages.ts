"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useMessages } from "./useMessages";
import { mapMessageRecordToDto } from "@/lib/services/messages/message.mapper";
import type { MessageDto } from "@/types/message.types";
import { QUERY_KEYS } from "@/lib/queryKeys";

function dedupeMessages(messages: MessageDto[]) {
  const seen = new Set<string>();
  return messages.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

export function useRealtimeMessages(conversationId: string | undefined, page = 1, perPage = 50) {
  const queryClient = useQueryClient();
  const { data: paginated } = useMessages(conversationId, page, perPage);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!conversationId) {
      setIsConnected(false);
      return;
    }

    const filter = `conversation_id=eq.${conversationId}`;

    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter },
        (payload) => {
          const newRow = (payload as any)?.new;
          if (!newRow) return;
          const dto = mapMessageRecordToDto(newRow);

          // update any cached message queries for this conversation
          const queries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.messages.root(conversationId), exact: false });
          for (const [key] of queries) {
            queryClient.setQueryData(key, (old: any) => {
              if (!old) return old;
              if (Array.isArray(old?.data)) {
                const newData = dedupeMessages([...old.data, dto]);
                return { ...old, data: newData };
              }
              if (Array.isArray(old)) {
                return dedupeMessages([...old, dto]);
              }
              return old;
            });
          }

          // update conversation lists ordering / latest message
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
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, queryClient, page, perPage]);

  const messages = paginated?.data ?? [];

  const sendMessage = async (content: string, mediaUrls: string[] = []) => {
    if (!conversationId) throw new Error("No conversation selected");
    const trimmed = content.trim();
    if (!trimmed && mediaUrls.length === 0) throw new Error("Message content or media is required");

    const res = await fetch(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed || null, media_urls: mediaUrls }),
      credentials: "same-origin",
    });

    if (res.status === 401) throw new Error("Unauthorized");
    const payload = await res.json().catch(() => null);
    if (!res.ok) throw new Error(payload?.error ?? "Failed to send message");
    const created = payload as MessageDto;

    // update local cache
    const queries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.messages.root(conversationId), exact: false });
    for (const [key] of queries) {
      queryClient.setQueryData(key, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old?.data)) {
          const newData = dedupeMessages([...old.data, created]);
          return { ...old, data: newData };
        }
        if (Array.isArray(old)) {
          return dedupeMessages([...old, created]);
        }
        return old;
      });
    }

    // ensure conversations list is fresh
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations.root() });

    return created;
  };

  return { messages, isConnected, sendMessage };
}
