import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { conversationService } from "@/lib/services/conversation.service";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";

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

    const isParticipant = await conversationService.checkParticipant(current.id, conversationId);
    return NextResponse.json({ isParticipant });
  } catch (err: any) {
    console.error("GET /api/conversations/[id]/participant error:", err);
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
