import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { postService } from "@/lib/services/post.service";
import { authService } from "@/lib/services/index";
import { AppError } from "@/lib/services/shared/app-error";
import { createPostSchema } from "@/lib/validations/post.schema";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const perPage = Math.max(1, parseInt(url.searchParams.get("perPage") ?? "20", 10) || 20);
    const marketplace = url.searchParams.get("marketplace") === "true";
    const userId = url.searchParams.get("userId") || undefined;

    // optional auth
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    let viewer: any = null;
    if (!error && supaUser) viewer = await authService.getCurrentUserFromSupabaseUser(supaUser);

    const list = await postService.listPosts(viewer?.id ?? null, page, perPage, marketplace, userId);
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/posts error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createPostSchema.parse(body);

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const created = await postService.createPost(current.id, parsed as any);
    return NextResponse.json(created);
  } catch (err: any) {
    console.error("POST /api/posts error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
