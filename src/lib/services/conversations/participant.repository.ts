import { prisma } from "@/lib/prisma";

/**
 * Update participant.last_read_at to now and return ISO timestamp
 */
export async function updateLastReadAt(userId: string, conversationId: string) {
  const now = new Date();

  // Use updateMany to avoid throwing if the participant row doesn't exist
  await prisma.conversation_participants.updateMany({
    where: { conversation_id: conversationId, user_id: userId },
    data: { last_read_at: now },
  });

  const participant = await prisma.conversation_participants.findUnique({
    where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    select: { last_read_at: true },
  });

  return participant?.last_read_at ? participant.last_read_at.toISOString() : null;
}

/**
 * Get unread count for a single conversation for a user.
 * Unread = messages in conversation where sender != user AND sent_at > last_read_at (or last_read_at IS NULL -> all messages)
 */
export async function getUnreadCount(conversationId: string, userId: string) {
  const participant = await prisma.conversation_participants.findUnique({
    where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } },
    select: { last_read_at: true },
  });

  if (!participant) return 0;

  if (!participant.last_read_at) {
    return prisma.messages.count({ where: { conversation_id: conversationId, sender_id: { not: userId } } });
  }

  return prisma.messages.count({ where: { conversation_id: conversationId, sender_id: { not: userId }, sent_at: { gt: participant.last_read_at } } });
}

/**
 * Get unread counts for all conversations the user participates in.
 * Returns a Map keyed by conversation_id -> unread count
 */
export async function getUnreadCountsForUser(userId: string) {
  // Use a single SQL query to join messages with participant last_read_at
  const rows: Array<{ conversation_id: string; unread: number }> = await prisma.$queryRaw`
    SELECT m.conversation_id, COUNT(*)::int AS unread
    FROM messages m
    JOIN conversation_participants p ON p.conversation_id = m.conversation_id AND p.user_id = ${userId}
    WHERE m.sender_id != ${userId} AND (p.last_read_at IS NULL OR m.sent_at > p.last_read_at)
    GROUP BY m.conversation_id
  `;

  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.conversation_id, Number(r.unread ?? 0));
  }

  return map;
}

export const conversationParticipantRepository = {
  updateLastReadAt,
  getUnreadCount,
  getUnreadCountsForUser,
};

export default conversationParticipantRepository;
