export const MESSAGES_ALL_CHANNEL = "public:messages-all";
export const MESSAGES_CHANNEL = "public:messages";

export function messagesInsertOpts() {
  return { event: "INSERT", schema: "public", table: "messages" };
}
