import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService } from "@/lib/services/index";
import { postService } from "@/lib/services/post.service";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("perPage") ?? "20") || 20;

    // optional auth to compute viewer state and visibility
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;

    let viewer: any = null;
    if (!error && supaUser) viewer = await authService.getCurrentUserFromSupabaseUser(supaUser);

    // ensure post exists and is visible to viewer
    await postService.getPostById(viewer?.id ?? null, id);

    const list = await postService.listPostShares(viewer?.id ?? null, id, page, perPage);
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/posts/[id]/shares error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
