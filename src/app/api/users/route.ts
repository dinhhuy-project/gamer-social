import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { userService } from "@/lib/services/user.service";
import { authService } from "@/lib/services/index";
import { AppError } from "@/lib/services/shared/app-error";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get("username") ?? undefined;

    // If username query provided => authenticated search by username (available to any logged-in user)
    if (username) {
      const supabase = await createClient();
      const resp = await supabase.auth.getUser();
      const supaUser = resp?.data?.user ?? null;
      const error = resp?.error ?? null;
      if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
      if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

      const profile = await userService.getPublicProfileByUsername(username, current.id);
      return NextResponse.json(profile);
    }

    // Otherwise: admin-only listing
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!actor) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // enforce admin
    await authService.requireUserHasRole(actor.id, ["admin"]);

    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const perPage = Math.max(1, parseInt(url.searchParams.get("perPage") ?? "20", 10) || 20);
    const q = url.searchParams.get("q") ?? undefined;

    const list = await userService.listUsers(page, perPage, q);
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/users error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
