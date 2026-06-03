import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService, membershipService } from "@/lib/services";
import { AppError } from "@/lib/services/shared/app-error";

export async function GET() {
  try {
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    if (resp?.error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const status = await membershipService.getMembershipStatus(current.id);
    return NextResponse.json(status);
  } catch (err: any) {
    console.error("GET /api/membership/status error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
