import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error } = await (await supabase).auth.getUser();

  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.users.findUnique({
    where: { auth_id: user.id },
    select: {
      id: true, username: true, email: true, display_name: true,
      avatar_url: true, cover_url: true, bio: true, role: true,
      is_active: true, created_at: true,
    },
  });

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  return NextResponse.json(profile);
}
