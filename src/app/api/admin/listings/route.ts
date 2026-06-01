import { NextResponse } from "next/server";

import { adminService } from "@/lib/services/admin.service";
import { AppError } from "@/lib/services/shared/app-error";
import { requireAdminActor } from "@/lib/utils/admin-auth";

function parsePostStatus(value: string | null) {
  return value === "active" || value === "hidden" || value === "deleted" ? value : "all";
}

function parseListingStatus(value: string | null) {
  return value === "pending_review" || value === "approved" || value === "rejected" || value === "sold"
    ? value
    : "all";
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdminActor();
    if ("error" in auth) return auth.error;

    const url = new URL(request.url);
    const result = await adminService.getMarketplaceListings({
      search: url.searchParams.get("search") ?? undefined,
      status: parsePostStatus(url.searchParams.get("status")),
      listingStatus: parseListingStatus(url.searchParams.get("listing_status")),
      page: Number(url.searchParams.get("page") ?? 1),
      limit: Number(url.searchParams.get("limit") ?? 20),
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("GET /api/admin/listings error:", err);
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
