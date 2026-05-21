import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";

export async function GET() {
  try {
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();

    const user = resp?.data?.user ?? null;
    const error = resp?.error ?? null;

    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dto = await authService.getCurrentUserFromSupabaseUser(user);

    if (!dto) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    return NextResponse.json(dto);
  } catch (err) {
    console.error("GET /api/me error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
