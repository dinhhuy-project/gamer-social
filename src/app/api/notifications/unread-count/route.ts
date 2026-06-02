import { NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notifications/notification.service";
import { AppError } from "@/lib/services/shared/app-error";
import { getCurrentUser } from "@/lib/api/route-utils";

export async function GET() {
  try {
    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const count = await notificationService.getUnreadCount(current.id);
    return NextResponse.json({ unread: count });
  } catch (err: any) {
    console.error("GET /api/notifications/unread-count error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
