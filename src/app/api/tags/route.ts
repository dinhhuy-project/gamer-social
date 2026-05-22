import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { tagService } from "@/lib/services/tag.service";
import { authService } from "@/lib/services/index";
import { AppError } from "@/lib/services/shared/app-error";
import { createTagSchema } from "@/lib/validations/tag.schema";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const perPage = Math.max(1, parseInt(url.searchParams.get("perPage") ?? "20", 10) || 20);
    const q = url.searchParams.get("q") ?? undefined;

    const list = await tagService.listTags(page, perPage, q);
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/tags error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createTagSchema.parse(body);

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    if (resp?.error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const created = await tagService.createTag(current.id, parsed.name);
    return NextResponse.json(created);
  } catch (err: any) {
    console.error("POST /api/tags error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

