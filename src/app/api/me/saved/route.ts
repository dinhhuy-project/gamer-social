import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService } from "@/lib/services/index";
import { savedPostService } from "@/lib/services/saved-post.service";
import { AppError } from "@/lib/services/shared/app-error";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1") || 1);
    const perPage = Math.max(1, Math.min(100, parseInt(url.searchParams.get("perPage") ?? url.searchParams.get("per_page") ?? "20") || 20));

    const result = await savedPostService.getSavedFeed(current.id, page, perPage);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("GET /api/me/saved error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
