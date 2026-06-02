import { NextResponse } from "next/server";
import { conversationService } from "@/lib/services";
import { AppError } from "@/lib/services/shared/app-error";
import { getCurrentUser } from "@/lib/api/route-utils";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const otherUserId =
      url.searchParams.get("otherUserId") ?? url.searchParams.get("other_user_id");

    if (!otherUserId) {
      return NextResponse.json({ error: "Missing otherUserId" }, { status: 400 });
    }

    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
