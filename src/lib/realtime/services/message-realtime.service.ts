import type { SupabaseClient } from "@supabase/supabase-js";
import type { MessageDto } from "@/types/message.types";
import { mapMessageRecordToDto } from "@/lib/services/messages/message.mapper";
import { messagesInsertOpts, MESSAGES_ALL_CHANNEL, MESSAGES_CHANNEL } from "@/lib/realtime/channels/conversation-channel";
import { realtimeManager } from "@/lib/realtime/realtime-manager";

export function subscribeToMessages(
  supabase: SupabaseClient,
  onInsert: (msg: MessageDto) => void
) {
  const seen = new Set<string>();
  const channelName = `${MESSAGES_ALL_CHANNEL}-${Math.random().toString(36).slice(2, 10)}`;

  const opts = messagesInsertOpts();

  const channel = (supabase as any)
    .channel(channelName)
    .on("postgres_changes", opts, (payload: any) => {
      // console.log("[realtime] subscribeToMessages payload:", payload);
      try {
        const newRow = payload?.new;
        if (!newRow) return;
        const dto = mapMessageRecordToDto(newRow);
        if (!dto || !dto.id) return;
        if (seen.has(dto.id)) return;
        seen.add(dto.id);
        onInsert(dto);
      } catch (err) {
        console.error("subscribeToMessages: handler error", err);
      }
    })
    .subscribe(() => {
      // console.log("[realtime] subscribeToMessages status", { channel: channelName, opts });
    });

  // register channel in global manager so it can be cleaned up on route changes
  try {
    realtimeManager.register(supabase, channel);
  } catch {
    // ignore
  }

  return () => {
    try {
      supabase.removeChannel(channel);
      try {
        realtimeManager.unregister(supabase, channel);
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  };
}

export function subscribeToConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
  onInsert: (msg: MessageDto) => void
) {
  const seen = new Set<string>();
  const channelName = `${MESSAGES_CHANNEL}-${conversationId}-${Math.random().toString(36).slice(2, 10)}`;
  const opts = { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` };

  const channel = (supabase as any)
    .channel(channelName)
    .on("postgres_changes", opts, (payload: any) => {
      // console.log("[realtime] subscribeToConversationMessages payload:", payload, { conversationId });
      try {
        const newRow = payload?.new;
        if (!newRow) return;
        const dto = mapMessageRecordToDto(newRow);
        if (!dto || !dto.id) return;
        if (seen.has(dto.id)) return;
        seen.add(dto.id);
        onInsert(dto);
      } catch (err) {
        console.error("subscribeToConversationMessages: handler error", err);
      }
    })
    .subscribe(() => {
      // console.log("[realtime] subscribeToConversationMessages status", { channel: channelName, opts, conversationId });
    });

  try {
    realtimeManager.register(supabase, channel);
  } catch {
    // ignore
  }

  return () => {
    try {
      supabase.removeChannel(channel);
      try {
        realtimeManager.unregister(supabase, channel);
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  };
}
