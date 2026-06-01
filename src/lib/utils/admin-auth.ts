import { NextResponse } from "next/server";

import { authService } from "@/lib/services/index";
import { createClient } from "@/lib/supabase/server";

export async function requireAdminActor() {
  const supabase = await createClient();
  const resp = await supabase.auth.getUser();
  const supaUser = resp?.data?.user ?? null;

  if (resp?.error || !supaUser) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const actor = await authService.getCurrentUserFromSupabaseUser(supaUser);
  if (!actor) {
    return { error: NextResponse.json({ error: "Profile not found" }, { status: 404 }) };
  }

  await authService.requireUserHasRole(actor.id, ["admin"]);

  return { actor };
}
