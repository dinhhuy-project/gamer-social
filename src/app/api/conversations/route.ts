import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService } from "@/lib/services/index";
import { conversationService } from "@/lib/services/conversation.service";
import { AppError } from "@/lib/services/shared/app-error";
import { createConversationSchema } from "../../../lib/validations/conversation.schema";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const perPage = Math.max(1, parseInt(url.searchParams.get("perPage") ?? "20", 10) || 20);

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const list = await conversationService.listConversations(current.id, page, perPage);
    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/conversations error:", err);
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const payload = {
      participant_ids: body?.participant_ids ?? body?.participantIds ?? [],
      tx_post_id: body?.tx_post_id ?? body?.txPostId ?? undefined,
      tx_buyer_id: body?.tx_buyer_id ?? body?.txBuyerId ?? undefined,
      tx_seller_id: body?.tx_seller_id ?? body?.txSellerId ?? undefined,
    };

    const parsed = createConversationSchema.parse(payload);

    const conversation = await conversationService.createConversation(current.id, {
      participantIds: parsed.participant_ids,
      txPostId: parsed.tx_post_id ?? null,
      txBuyerId: parsed.tx_buyer_id ?? null,
      txSellerId: parsed.tx_seller_id ?? null,
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/conversations error:", err);
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
