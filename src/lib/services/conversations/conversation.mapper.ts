import type { ConversationDto, TradeMetadataDto } from "@/types/conversation.types";
import type { MessageDto } from "@/types/message.types";

function toPublicUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name ?? null,
    avatarUrl: user.avatar_url ?? null,
    role: user.role,
  };
}

export function mapMessageRecordToDto(message: any): MessageDto {
  return {
    id: message.id,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    content: message.content ?? null,
    mediaUrls: message.media_urls ?? [],
    sentAt: message.sent_at instanceof Date ? message.sent_at.toISOString() : String(message.sent_at),
  };
}

export function mapConversationToDto(conversation: any): ConversationDto {
  const trade = conversation.tx_post_id
    ? {
      txPostId: conversation.tx_post_id,
      txBuyerId: conversation.tx_buyer_id,
      txSellerId: conversation.tx_seller_id,
      txStatus: conversation.tx_status as TradeMetadataDto["txStatus"] | null,
      txBuyerConfirmedAt: conversation.tx_buyer_confirmed_at
        ? conversation.tx_buyer_confirmed_at.toISOString()
        : null,
      txSellerConfirmedAt: conversation.tx_seller_confirmed_at
        ? conversation.tx_seller_confirmed_at.toISOString()
        : null,
      txAdminId: conversation.tx_admin_id,
      txAdminJoinedAt: conversation.tx_admin_joined_at
        ? conversation.tx_admin_joined_at.toISOString()
        : null,
      txCompletedAt: conversation.tx_completed_at
        ? conversation.tx_completed_at.toISOString()
        : null,
      txCancelledAt: conversation.tx_cancelled_at
        ? conversation.tx_cancelled_at.toISOString()
        : null,
    }
    : undefined;

  return {
    id: conversation.id,
    participants: conversation.conversation_participants.map((part: any) => toPublicUser(part.users)),
    latestMessage: conversation.messages?.[0] ? mapMessageRecordToDto(conversation.messages[0]) : null,
    updatedAt: conversation.updated_at instanceof Date ? conversation.updated_at.toISOString() : String(conversation.updated_at),
    trade,
  } as ConversationDto;
}

export function normalizeParticipantIds(participantIds: string[], actorId: string) {
  const uniqueIds = Array.from(
    new Set(
      participantIds
        .map((id) => id?.trim())
        .filter((id): id is string => Boolean(id))
    )
  );

  if (!uniqueIds.includes(actorId)) {
    uniqueIds.push(actorId);
  }

  return uniqueIds;
}
