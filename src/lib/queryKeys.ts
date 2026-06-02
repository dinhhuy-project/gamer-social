export const QUERY_KEYS = {
  messages: {
    root: (conversationId?: string) => ["messages", conversationId ?? ""],
    list: (conversationId: string, page: number, perPage: number) => ["messages", conversationId, page, perPage],
  },
  conversations: {
    root: () => ["conversations"],
    list: (page: number, perPage: number) => ["conversations", page, perPage],
  },
  conversation: (conversationId: string) => ["conversation", conversationId],
  notifications: {
    root: (userId?: string) => ["notifications", userId ?? ""],
    list: (userId: string) => ["notifications", userId],
    unread: (userId: string) => ["notifications", userId, "unread"],
  },
  unread: {
    conversation: (conversationId: string) => ["unread", "conversation", conversationId],
    total: () => ["unread", "total"],
  },
};
