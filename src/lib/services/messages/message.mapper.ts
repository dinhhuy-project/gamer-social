import type { MessageDto } from "@/types/message.types";

export function mapMessageRecordToDto(message: any): MessageDto {
  return {
    id: message.id,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    content: message.content ?? null,
    mediaUrls: message.media_urls ?? [],
    sentAt:
      message.sent_at instanceof Date ? message.sent_at.toISOString() : String(message.sent_at),
  };
}
