import { NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notifications/notification.service";
import { AppError } from "@/lib/services/shared/app-error";
import { getCurrentUser, getRouteParamId } from "@/lib/api/route-utils";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const notificationId = await getRouteParamId(params as any);
    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ok = await notificationService.markAsRead(notificationId, current.id);
    return NextResponse.json({ ok });
  } catch (err: any) {
    console.error("POST /api/notifications/[id]/read error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
