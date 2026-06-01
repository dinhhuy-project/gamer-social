import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";
import { conversationService } from "@/lib/services/conversation.service";
import { AppError } from "@/lib/services/shared/app-error";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const otherUserId =
      url.searchParams.get("otherUserId") ?? url.searchParams.get("other_user_id");

    if (!otherUserId) {
      return NextResponse.json({ error: "Missing otherUserId" }, { status: 400 });
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

    const conversation = await conversationService.findConversationBetweenUsers(
      current.id,
      otherUserId
    );

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (err: any) {
    console.error("GET /api/conversations/find error:", err);
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
