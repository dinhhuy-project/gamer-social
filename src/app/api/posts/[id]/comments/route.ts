import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { commentService } from "@/lib/services/comment.service";
import { authService } from "@/lib/services/index";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";
import { createCommentSchema } from "@/lib/validations/comment.schema";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const perPage = Math.max(1, parseInt(url.searchParams.get("perPage") ?? "20", 10) || 20);
    const repliesPerRoot = Math.max(0, parseInt(url.searchParams.get("repliesPerRoot") ?? "3", 10) || 3);
    const tree = url.searchParams.get("tree") === "true";

    // optional auth
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;

    let viewer: any = null;
    if (!error && supaUser) viewer = await authService.getCurrentUserFromSupabaseUser(supaUser);

    if (tree) {
      const commentTree = await commentService.listCommentTree(viewer?.id ?? null, id);
      return NextResponse.json(commentTree);
    }

    const list = await commentService.listComments(viewer?.id ?? null, id, page, perPage, repliesPerRoot);
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/posts/[id]/comments error:", err);
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
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await request.json();
    const validated = createCommentSchema.parse({ ...body, post_id: id });

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const created = await commentService.createComment(current.id, id, { content: validated.content, parentId: validated.parent_id ?? undefined });
    return NextResponse.json(created);
  } catch (err: any) {
    console.error("POST /api/posts/[id]/comments error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
