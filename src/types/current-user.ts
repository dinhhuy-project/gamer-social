// CurrentUser represents the resolved application user.
// Notes:
// - `id` is `users.id` from the application database (UUID used throughout the app).
// - `authId` is the Supabase `auth.users.id` value (returned by `auth.uid()` in RLS).
// These two IDs are distinct and must never be compared directly.
// Always resolve the application user (by `authId`) to obtain `id` before comparing ownership.

export interface CurrentUser {
  /** Application user id (users.id) */
  id: string;

  /** Supabase Auth user id (auth.users.id) */
  authId: string;

  username: string;
  displayName: string;
  avatarUrl?: string | null;
}
