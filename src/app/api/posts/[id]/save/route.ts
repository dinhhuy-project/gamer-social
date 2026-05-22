import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService } from "@/lib/services/index";
import { savedPostService } from "@/lib/services/saved-post.service";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    let id = params?.id;
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

    // optional auth to compute bookmark state for the viewer
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;

    let viewer: any = null;
    if (!error && supaUser) viewer = await authService.getCurrentUserFromSupabaseUser(supaUser);

    const state = await savedPostService.getBookmarkState(viewer?.id ?? null, id);
    return NextResponse.json(state);
  } catch (err: any) {
    console.error("GET /api/posts/[id]/save error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    let id = params?.id;
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

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const res = await savedPostService.savePost(current.id, id);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("POST /api/posts/[id]/save error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    let id = params?.id;
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

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const result = await savedPostService.unsavePost(current.id, id);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("DELETE /api/posts/[id]/save error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
