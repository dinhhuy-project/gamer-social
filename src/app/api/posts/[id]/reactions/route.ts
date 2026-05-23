import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { reactionService } from "@/lib/services/reaction.service";
import { authService } from "@/lib/services/index";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";
import { reactionSchema } from "@/lib/validations/reaction.schema";

export async function GET(
  _request: Request,
  context: { params?: any }
) {
  try {
    const params = await context?.params;
    let id = params?.id;
    // fallback: parse id from URL when params not provided (robustness for some runtimes)
    if (!id) {
      try {
        const url = new URL(_request.url);
        const segs = url.pathname.split("/").filter(Boolean);
        const postsIndex = segs.findIndex((s) => s === "posts");
        if (postsIndex >= 0 && segs.length > postsIndex + 1) id = segs[postsIndex + 1];
      } catch (e) {
        // ignore
      }
    }
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // optional auth
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;

    let viewer: any = null;
    if (!error && supaUser) viewer = await authService.getCurrentUserFromSupabaseUser(supaUser);

    const summary = await reactionService.getPostReactionsSummary(id, viewer?.id ?? null);
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error("GET /api/posts/[id]/reactions error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params?: any }
) {
  try {
    const params = await context?.params;
    let id = params?.id;
    if (!id) {
      try {
        const url = new URL(request.url);
        const segs = url.pathname.split("/").filter(Boolean);
        const postsIndex = segs.findIndex((s) => s === "posts");
        if (postsIndex >= 0 && segs.length > postsIndex + 1) id = segs[postsIndex + 1];
      } catch (e) { }
    }
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const body = await request.json();
    const parsed = reactionSchema.parse(body);

    const res = await reactionService.reactToPost(current.id, id, parsed.type as any);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("POST /api/posts/[id]/reactions error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params?: any }
) {
  try {
    const params = await context?.params;
    let id = params?.id;
    if (!id) {
      try {
        const url = new URL(_request.url);
        const segs = url.pathname.split("/").filter(Boolean);
        const postsIndex = segs.findIndex((s) => s === "posts");
        if (postsIndex >= 0 && segs.length > postsIndex + 1) id = segs[postsIndex + 1];
      } catch (e) { }
    }
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const deleted = await reactionService.removeReactionFromPost(current.id, id);
    return NextResponse.json(deleted);
  } catch (err: any) {
    console.error("DELETE /api/posts/[id]/reactions error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
