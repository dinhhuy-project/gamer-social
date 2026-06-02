export const NOTIFICATIONS_CHANNEL = "public:notifications";

export function notificationsInsertOpts(userId?: string) {
  if (!userId) return { event: "INSERT", schema: "public", table: "notifications" };
  return { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` };
}
