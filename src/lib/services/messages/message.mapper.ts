import type { MessageDto } from "@/types/message.types";

export function mapMessageRecordToDto(message: any): MessageDto {
  // handle several possible shapes from realtime payloads (snake_case or camelCase)
  const id = message?.id ?? message?.message_id ?? message?.messageId ?? "";
  const conversationId = message?.conversation_id ?? message?.conversationId ?? "";
  const senderId = message?.sender_id ?? message?.senderId ?? message?.sender ?? "";
  const content = message?.content ?? message?.body ?? null;

  let mediaUrls: string[] = [];
  if (Array.isArray(message?.media_urls)) mediaUrls = message.media_urls;
  else if (Array.isArray(message?.mediaUrls)) mediaUrls = message.mediaUrls;
  else if (typeof message?.media_urls === "string") {
    try {
      mediaUrls = JSON.parse(message.media_urls);
    } catch (_) {
      mediaUrls = [];
    }
  }

  const sentAtRaw = message?.sent_at ?? message?.sentAt ?? "";
  const sentAt = sentAtRaw instanceof Date ? sentAtRaw.toISOString() : String(sentAtRaw ?? "");

  return {
    id: String(id),
    conversationId: String(conversationId),
    senderId: String(senderId),
    content: content ?? null,
    mediaUrls,
    sentAt,
  };
}
