import { NextResponse } from "next/server";
import { z } from "zod";

import { adminService } from "@/lib/services/admin.service";
import { AppError } from "@/lib/services/shared/app-error";
import { requireAdminActor } from "@/lib/utils/admin-auth";

const updatePostSchema = z.object({
  status: z.enum(["active", "hidden", "deleted"]),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminActor();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    return NextResponse.json(await adminService.getPostDetail(id));
  } catch (err: unknown) {
    console.error("GET /api/admin/posts/[id] error:", err);
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
    const input = updatePostSchema.parse(await request.json());
    return NextResponse.json(await adminService.updatePostStatus(id, input.status));
  } catch (err: unknown) {
    console.error("PATCH /api/admin/posts/[id] error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }

    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
