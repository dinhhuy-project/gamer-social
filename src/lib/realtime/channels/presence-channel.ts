// Presence channel helpers (placeholder, use Supabase Presence API where needed)
export const PRESENCE_USERS = "presence:users";
export function presenceChannelFor(key: string) {
  return `presence:${key}`;
}
