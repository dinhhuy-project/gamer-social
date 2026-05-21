import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateProfileSchema } from "@/lib/validations/user.schema";
import { authService } from "@/lib/services/index";
import { userService } from "@/lib/services/user.service";
import { AppError } from "@/lib/services/shared/app-error";
import { ZodError } from "zod";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();

    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!actor) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const body = await request.json();
    const input = updateProfileSchema.parse(body);

    const updated = await userService.updateProfile(actor.id, params.id, input);
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /api/admin/users/[id] error:", err);
    if (err instanceof ZodError) return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();

    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!actor) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const deleted = await userService.deleteAccount(actor.id, params.id);
    return NextResponse.json(deleted);
  } catch (err: any) {
    console.error("DELETE /api/admin/users/[id] error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
