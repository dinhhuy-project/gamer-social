import { createClient } from "@/lib/supabase/server";
import { authService } from "@/lib/services";

export async function getRouteParamId(
  params: Promise<{ id: string }>
): Promise<string> {
  const resolved = await params;

  if (!resolved?.id) {
    throw new Error("Missing id");
  }

  return resolved.id;
}

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return authService.getCurrentUserFromSupabaseUser(user);
}

export async function requireCurrentUser() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  return currentUser;
}