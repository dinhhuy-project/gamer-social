import { NextResponse } from "next/server";
import { conversationService } from "@/lib/services";
import { AppError, NotFoundError, ForbiddenError } from "@/lib/services/shared/app-error";
import { getCurrentUser, getRouteParamId } from "@/lib/api/route-utils";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = await getRouteParamId(params as any);
    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversation = await conversationService.adminJoinTrade(current.id, conversationId);
    return NextResponse.json(conversation);
  } catch (err: any) {
    console.error("POST /api/conversations/[id]/admin-join error:", err);
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
