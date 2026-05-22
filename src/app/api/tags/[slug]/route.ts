import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { tagService } from "@/lib/services/tag.service";
import { authService } from "@/lib/services/index";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";
import { updateTagSchema } from "@/lib/validations/tag.schema";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const tag = await tagService.getTagBySlug(slug);
    return NextResponse.json(tag);
  } catch (err: any) {
    console.error("GET /api/tags/[slug] error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    if (resp?.error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const tag = await tagService.getTagBySlug(slug);

    const body = await request.json();
    const parsed = updateTagSchema.parse(body);

    const updated = await tagService.updateTag(current.id, tag.id, parsed);
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/tags/[slug] error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    if (resp?.error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const tag = await tagService.getTagBySlug(slug);
    const res = await tagService.deleteTag(current.id, tag.id);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("DELETE /api/tags/[slug] error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
