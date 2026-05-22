import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { postService } from "@/lib/services/post.service";
import { authService } from "@/lib/services/index";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";
import { createPostSchema } from "@/lib/validations/post.schema";

const updateSchema = createPostSchema.partial().extend({ tag_ids: createPostSchema.shape.tag_ids.optional().nullable() as any });

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // optional auth
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    let viewer: any = null;
    if (!error && supaUser) viewer = await authService.getCurrentUserFromSupabaseUser(supaUser);

    const post = await postService.getPostById(viewer?.id ?? null, id);
    return NextResponse.json(post);
  } catch (err: any) {
    console.error("GET /api/posts/[id] error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const body = await request.json();

    // action shortcuts
    if (body && body.action === "hide") {
      const res = await postService.hidePost(current.id, id);
      return NextResponse.json(res);
    }

    if (body && body.action === "restore") {
      const res = await postService.restorePost(current.id, id);
      return NextResponse.json(res);
    }

    const parsed = updateSchema.parse(body);
    const res = await postService.updatePost(current.id, id, parsed as any);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("PATCH /api/posts/[id] error:", err);
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
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const res = await postService.deletePost(current.id, id);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("DELETE /api/posts/[id] error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
