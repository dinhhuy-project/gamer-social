import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { reactionService } from "@/lib/services/reaction.service";
import { authService } from "@/lib/services/index";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";
import { reactionSchema } from "@/lib/validations/reaction.schema";

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

    const summary = await reactionService.getCommentReactionsSummary(id, viewer?.id ?? null);
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error("GET /api/comments/[id]/reactions error:", err);
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

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const body = await request.json();
    const parsed = reactionSchema.parse(body);

    const res = await reactionService.reactToComment(current.id, id, parsed.type as any);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("POST /api/comments/[id]/reactions error:", err);
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

    const deleted = await reactionService.removeReactionFromComment(current.id, id);
    return NextResponse.json(deleted);
  } catch (err: any) {
    console.error("DELETE /api/comments/[id]/reactions error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

