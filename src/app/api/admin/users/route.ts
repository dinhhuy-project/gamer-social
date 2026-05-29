import { NextResponse } from "next/server";

import { adminService } from "@/lib/services/admin.service";
import { authService } from "@/lib/services/index";
import { AppError } from "@/lib/services/shared/app-error";
import { createClient } from "@/lib/supabase/server";

async function requireAdminActor() {
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

function parseBooleanFilter(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdminActor();
    if ("error" in auth) return auth.error;

    const url = new URL(request.url);
    const role = url.searchParams.get("role") ?? "all";

    const result = await adminService.getUsers({
      search: url.searchParams.get("search") ?? undefined,
      role: role === "user" || role === "member" || role === "admin" ? role : "all",
      isActive: parseBooleanFilter(url.searchParams.get("is_active")),
      verified: parseBooleanFilter(url.searchParams.get("verified")),
      page: Number(url.searchParams.get("page") ?? 1),
      limit: Number(url.searchParams.get("limit") ?? 20),
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("GET /api/admin/users error:", err);
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
