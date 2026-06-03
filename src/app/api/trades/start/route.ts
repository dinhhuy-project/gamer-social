import { NextResponse } from "next/server";
import { tradeService } from "@/lib/services/trade.service";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";
import { getCurrentUser } from "@/lib/api/route-utils";

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const conversationId = (body?.conversationId ?? body?.conversation_id) as string | undefined;
    if (!conversationId) return NextResponse.json({ error: "conversationId is required" }, { status: 400 });

    const updated = await tradeService.startTrade(conversationId, current.id);
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("POST /api/trades/start error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
