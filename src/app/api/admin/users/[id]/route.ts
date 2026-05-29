import { NextResponse } from "next/server";
import { z } from "zod";

import { adminService } from "@/lib/services/admin.service";
import { authService } from "@/lib/services/index";
import { AppError } from "@/lib/services/shared/app-error";
import { createClient } from "@/lib/supabase/server";

const updateUserSchema = z
  .object({
    role: z.enum(["user", "member"]).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.is_active !== undefined, {
    message: "No supported fields provided",
  });

async function requireAdminActor() {
  const supabase = await createClient();
  const resp = await supabase.auth.getUser();
  const supaUser = resp?.data?.user ?? null;

  if (resp?.error || !supaUser) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const actor = await authService.getCurrentUserFromSupabaseUser(supaUser);
  if (!actor) {
    return { error: NextResponse.json({ error: "Profile not found" }, { status: 404 }) };
  }

  await authService.requireUserHasRole(actor.id, ["admin"]);

  return { actor };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminActor();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    const user = await adminService.getUserDetail(id);

    return NextResponse.json(user);
  } catch (err: unknown) {
    console.error("GET /api/admin/users/[id] error:", err);
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminActor();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    const input = updateUserSchema.parse(await request.json());

    if (typeof input.is_active === "boolean") {
      await adminService.updateUserStatus(auth.actor.id, id, input.is_active);
    }

    if (input.role) {
      await adminService.updateUserRole(id, input.role);
    }

    const user = await adminService.getUserDetail(id);
    return NextResponse.json(user);
  } catch (err: unknown) {
    console.error("PATCH /api/admin/users/[id] error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }

    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
