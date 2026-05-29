import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { authService } from "@/lib/services/index";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const actor = await authService.getCurrentUserFromSupabaseUser(user);

  if (!actor || actor.role !== "admin") {
    redirect("/feed");
  }

  return <div className="min-h-screen bg-zinc-950 text-zinc-100">{children}</div>;
}
