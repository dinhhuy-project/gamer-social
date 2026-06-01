import { NextResponse } from "next/server";
import { z } from "zod";

import { adminService } from "@/lib/services/admin.service";
import { AppError } from "@/lib/services/shared/app-error";
import { requireAdminActor } from "@/lib/utils/admin-auth";

const reviewListingSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reject_reason: z.string().trim().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminActor();
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    const input = reviewListingSchema.parse(await request.json());

    return NextResponse.json(
      await adminService.reviewMarketplaceListing({
        adminId: auth.actor.id,
        postId: id,
        action: input.action,
        rejectReason: input.reject_reason,
      })
    );
  } catch (err: unknown) {
    console.error("PATCH /api/admin/listings/[id]/review error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }

    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
