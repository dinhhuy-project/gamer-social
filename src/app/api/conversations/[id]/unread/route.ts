import { NextResponse } from "next/server";
import { unreadService } from "@/lib/services/unread.service";
import { AppError } from "@/lib/services/shared/app-error";
import { getCurrentUser, getRouteParamId } from "@/lib/api/route-utils";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const conversationId = await getRouteParamId(params as any);
    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const count = await unreadService.getConversationUnreadCount(current.id, conversationId);
    return NextResponse.json({ unread: count });
  } catch (err: any) {
    console.error("GET /api/conversations/[id]/unread error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
