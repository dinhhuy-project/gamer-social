import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("GET /api/auth/session supabase.auth.getSession error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const session = (data as any)?.session ?? null;
    if (!session) return NextResponse.json({ error: "No session" }, { status: 401 });

    return NextResponse.json({ session });
  } catch (err: any) {
    console.error("GET /api/auth/session error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
