import { prisma } from "@/lib/prisma";

export async function createMessageTx(
  tx: any,
  payload: {
    conversationId: string;
    senderId: string;
    content: string | null;
    mediaUrls: string[];
  }
) {
  return tx.messages.create({
    data: {
      conversation_id: payload.conversationId,
      sender_id: payload.senderId,
      content: payload.content,
      media_urls: payload.mediaUrls,
    },
  });
}

export async function updateConversationUpdatedAtTx(tx: any, conversationId: string) {
  return tx.conversations.update({
    where: { id: conversationId },
    data: { updated_at: new Date() },
  });
}

export async function countMessages(conversationId: string) {
  return prisma.messages.count({
    where: {
      conversation_id: conversationId,
      is_deleted: false,
    },
  });
}

export async function findMessages(conversationId: string, skip: number, take: number) {
  return prisma.messages.findMany({
    where: {
      conversation_id: conversationId,
      is_deleted: false,
    },
    orderBy: { sent_at: "asc" },
    skip,
    take,
  });
}
