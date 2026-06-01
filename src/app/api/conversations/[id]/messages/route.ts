import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { messageService } from "@/lib/services/message.service";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";
import { sendMessageSchema } from "@/lib/validations/message.schema";

function parsePagination(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const perPage = Math.max(1, parseInt(url.searchParams.get("perPage") ?? "50", 10) || 50);
  return { page, perPage };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversation id" }, { status: 400 });
    }

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

    const { page, perPage } = parsePagination(request);
    const messageList = await messageService.listMessages(current.id, conversationId, page, perPage);
    return NextResponse.json(messageList);
  } catch (err: any) {
    console.error("GET /api/conversations/[id]/messages error:", err);
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversation id" }, { status: 400 });
    }

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
      conversation_id: conversationId,
      content: body?.content ?? body?.message ?? null,
      media_urls: body?.media_urls ?? body?.mediaUrls ?? undefined,
    };

    const parsed = sendMessageSchema.parse(payload);

    const created = await messageService.createMessage(current.id, {
      conversationId: parsed.conversation_id,
      senderId: current.id,
      content: parsed.content,
      mediaUrls: parsed.media_urls ?? undefined,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/conversations/[id]/messages error:", err);
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
