// Helpers to ensure a browser Supabase client has a valid session set from the server-side session endpoint.
// This centralizes the duplicated logic previously spread across multiple realtime hooks.

import type { SupabaseClient } from "@supabase/supabase-js";
import { apiClient } from "@/lib/api/api-client";

type SessionResolution = { authUserId: string | null; appUserId: string | null };

export async function ensureSupabaseClientSession(supabase: SupabaseClient): Promise<SessionResolution> {
  let session: any = null;
  try {
    const resp = await supabase.auth.getSession();
    session = (resp as any)?.data?.session ?? null;
  } catch (err) {
    session = null;
  }

  if (!session) {
    try {
      const json = await apiClient<any>("/api/auth/session", { credentials: "same-origin" });
      const serverSession = json?.session;
      if (serverSession?.access_token) {
        const { error: setError } = await supabase.auth.setSession({ access_token: serverSession.access_token, refresh_token: serverSession.refresh_token });
        if (setError) console.error("ensureSupabaseClientSession: supabase.auth.setSession error", setError);
        const after = await supabase.auth.getSession();
        session = (after as any)?.data?.session ?? null;
      }
    } catch (err) {
      console.error("ensureSupabaseClientSession: fetch server session failed", err);
    }
  }

  const authUserId = session?.user?.id ?? null;

  // Try to resolve the application user id (users.id) via /api/me
  let appUserId: string | null = null;
  try {
    const meJson = await (async () => {
      try {
        return await apiClient<any>("/api/me", { credentials: "same-origin" });
      } catch (err) {
        return null;
      }
    })();

    if (meJson && typeof meJson.id === "string") {
      const candidate = meJson.id.trim();
      if (/^[0-9a-fA-F-]{36}$/.test(candidate)) {
        appUserId = candidate;
      } else {
        console.warn("ensureSupabaseClientSession: /api/me returned non-uuid id", candidate);
      }
    }
  } catch (err) {
    // ignore failures resolving /api/me; appUserId remains null
    console.debug("ensureSupabaseClientSession: /api/me fetch failed", err);
  }

  // console.log("[realtime] ensureSupabaseClientSession resolved:", { authUserId, appUserId });

  return { authUserId, appUserId };
}
