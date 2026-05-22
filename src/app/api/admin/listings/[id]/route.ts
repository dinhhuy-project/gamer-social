import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { postService } from "@/lib/services/post.service";
import { authService } from "@/lib/services/index";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";

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

    // enforce admin
    await authService.requireUserHasRole(current.id, ["admin"]);

    const body = await request.json();
    const approve = !!body.approve;
    const rejectReason = body.rejectReason ?? body.reject_reason ?? undefined;

    const res = await postService.reviewListing(current.id, id, approve, rejectReason);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("PATCH /api/admin/listings/[id] error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
