import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService } from "@/lib/services/index";
import { postService } from "@/lib/services/post.service";
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
      } catch {
        // ignore
      }
    }
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // optional auth to compute viewer state
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;

    let viewer: any = null;
    if (!error && supaUser) viewer = await authService.getCurrentUserFromSupabaseUser(supaUser);

    const state = await postService.getShareState(viewer?.id ?? null, id);
    return NextResponse.json(state);
  } catch (err: any) {
    console.error("GET /api/posts/[id]/share error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    let id = params?.id;
    if (!id) {
      try {
        const url = new URL(request.url);
        const segs = url.pathname.split("/").filter(Boolean);
        const postsIndex = segs.findIndex((s) => s === "posts");
        if (postsIndex >= 0 && segs.length > postsIndex + 1) id = segs[postsIndex + 1];
      } catch {
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

    const body = await request.json().catch(() => ({}));
    const note = body?.note;

    const res = await postService.sharePost(current.id, id, note);
    return NextResponse.json(res);
  } catch (err: any) {
    // Log full error for debugging
    console.error("POST /api/posts/[id]/share error:", err?.stack || err);

    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });

    // In development return the actual error message to aid debugging.
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json({ error: isDev ? (err?.message || String(err)) : "Internal Server Error" }, { status: 500 });
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
      } catch {
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

    const result = await postService.unsharePost(current.id, id);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("DELETE /api/posts/[id]/share error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
