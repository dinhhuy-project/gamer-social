import { NextResponse } from "next/server";
import { unreadService } from "@/lib/services/unread.service";
import { AppError } from "@/lib/services/shared/app-error";
import { getCurrentUser, getRouteParamId } from "@/lib/api/route-utils";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const conversationId = await getRouteParamId(params as any);
    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await unreadService.markConversationRead(current.id, conversationId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("POST /api/conversations/[id]/read error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
