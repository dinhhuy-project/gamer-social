import * as repo from "@/lib/services/conversations/participant.repository";

export async function markConversationRead(userId: string, conversationId: string) {
  const lastReadAt = await repo.updateLastReadAt(userId, conversationId);

  // return lastReadAt and current total unread so clients can sync caches
  const counts = await repo.getUnreadCountsForUser(userId);
  let total = 0;
  for (const v of counts.values()) total += v;

  return { lastReadAt, totalUnreadCount: total };
}

export async function getConversationUnreadCount(userId: string, conversationId: string) {
  return repo.getUnreadCount(conversationId, userId);
}

export async function getTotalUnreadCount(userId: string) {
  const counts = await repo.getUnreadCountsForUser(userId);
  let total = 0;
  for (const v of counts.values()) total += v;
  return total;
}

export const unreadService = {
  markConversationRead,
  getConversationUnreadCount,
  getTotalUnreadCount,
};

export default unreadService;
