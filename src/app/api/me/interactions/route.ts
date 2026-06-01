import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService, savedPostService } from "@/lib/services/index";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/services/shared/app-error";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;

    if (error || !supaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const perPage = Math.max(1, Math.min(100, parseInt(url.searchParams.get("perPage") ?? url.searchParams.get("per_page") ?? "20", 10) || 20));

    const [savedFeed, sharedPostsCount, reactionsCount] = await Promise.all([
      savedPostService.getSavedFeed(current.id, page, perPage),
      prisma.post_shares.count({ where: { user_id: current.id } }),
      prisma.reactions.count({ where: { user_id: current.id } }),
    ]);

    return NextResponse.json({
      savedPosts: savedFeed,
      sharedPostsCount,
      reactionsCount,
    });
  } catch (err: any) {
    console.error("GET /api/me/interactions error:", err);
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
