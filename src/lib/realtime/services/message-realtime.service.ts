import type { SupabaseClient } from "@supabase/supabase-js";
import type { MessageDto } from "@/types/message.types";
import { mapMessageRecordToDto } from "@/lib/services/messages/message.mapper";
import { messagesInsertOpts, MESSAGES_ALL_CHANNEL, MESSAGES_CHANNEL } from "@/lib/realtime/channels/conversation-channel";

export function subscribeToMessages(
  supabase: SupabaseClient,
  onInsert: (msg: MessageDto) => void
) {
  const seen = new Set<string>();

  const opts = messagesInsertOpts();

  const channel = (supabase as any)
    .channel(MESSAGES_ALL_CHANNEL)
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
    .subscribe((status: string) => {
      // console.log("[realtime] subscribeToMessages status:", status, { channel: MESSAGES_ALL_CHANNEL, opts });
    });

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (err) {
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
  const opts = { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` };

  const channel = (supabase as any)
    .channel(MESSAGES_CHANNEL)
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
    .subscribe((status: string) => {
      // console.log("[realtime] subscribeToConversationMessages status:", status, { channel: MESSAGES_CHANNEL, opts, conversationId });
    });

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (err) {
      // ignore
    }
  };
}
