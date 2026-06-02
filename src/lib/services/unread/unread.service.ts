// Unread message tracking has been disabled. Keep API surface but return
// neutral values so callers become no-ops and UI shows no unread counts.

export async function markConversationRead(userId: string, conversationId: string) {
  return { lastReadAt: null, totalUnreadCount: 0 };
}

export async function getConversationUnreadCount(userId: string, conversationId: string) {
  return 0;
}

export async function getTotalUnreadCount(userId: string) {
  return 0;
}

export const unreadService = {
  markConversationRead,
  getConversationUnreadCount,
  getTotalUnreadCount,
};

export default unreadService;
