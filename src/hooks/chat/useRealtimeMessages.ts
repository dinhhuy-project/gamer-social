"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatRealtimeService } from "@/lib/services/realtime";
import type { MessageDto } from "@/types/message.types";

function dedupeMessages(messages: MessageDto[]) {
  const seen = new Set<string>();
  return messages.filter((message) => {
    if (seen.has(message.id)) return false;
    seen.add(message.id);
    return true;
  });
}

export function useRealtimeMessages(
  conversationId: string | undefined,
  initialMessages: MessageDto[] = []
) {
  const [messages, setMessages] = useState<MessageDto[]>(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setMessages(dedupeMessages(initialMessages));
  }, [conversationId, initialMessages]);

  useEffect(() => {
    if (!conversationId) {
      setIsConnected(false);
      return;
    }

    const channel = ChatRealtimeService.subscribeToMessages(
      supabase,
      conversationId,
      ({ message }) => {
        setMessages((current) => dedupeMessages([...current, message]));
      }
    );

    channel.subscribe((status) => {
      setIsConnected(status === "SUBSCRIBED");
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  const sendMessage = useCallback(
    async (content: string, mediaUrls: string[] = []) => {
      if (!conversationId) {
        throw new Error("No conversation selected");
      }

      const trimmed = content.trim();
      if (!trimmed && mediaUrls.length === 0) {
        throw new Error("Message content or media is required");
      }

      const response = await fetch(
        `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: trimmed || null,
            media_urls: mediaUrls,
          }),
        }
      );

      if (response.status === 401) {
        throw new Error("Unauthorized");
      }

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to send message");
      }

      const created = payload as MessageDto;
      setMessages((current) => dedupeMessages([...current, created]));
      return created;
    },
    [conversationId]
  );

  return {
    messages,
    isConnected,
    sendMessage,
  };
}
