import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService } from "@/lib/services/auth.service";

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error } = await (await supabase).auth.getUser();

  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dto = await authService.getCurrentUserFromSupabaseUser(user);

  if (!dto) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json(dto);
}
