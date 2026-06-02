import { NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notifications/notification.service";
import { AppError } from "@/lib/services/shared/app-error";
import { getCurrentUser } from "@/lib/api/route-utils";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1") || 1;
    const perPage = Number(url.searchParams.get("perPage") ?? "20") || 20;

    const current = await getCurrentUser();
    if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await notificationService.getNotifications(current.id, page, perPage);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("GET /api/notifications error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
