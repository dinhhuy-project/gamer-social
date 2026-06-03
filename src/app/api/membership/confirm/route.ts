import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService, membershipService } from "@/lib/services";
import { AppError } from "@/lib/services/shared/app-error";
import { confirmMembershipPaymentSchema } from "@/lib/validations/membership.schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = confirmMembershipPaymentSchema.parse(body);

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    if (resp?.error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const status = await membershipService.confirmMembershipPaymentForUser(current.id, parsed.paymentRef);
    return NextResponse.json(status);
  } catch (err: any) {
    console.error("POST /api/membership/confirm error:", err);
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    if (err?.name === "ZodError") return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
