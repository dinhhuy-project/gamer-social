import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { authService } from "@/lib/services/index";
import { createClient } from "@/lib/supabase/server";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { SiteHeader } from "@/components/layout/Topbar";

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

  return (
    <SidebarProvider>
      <TooltipProvider>
        <AdminSidebar />
        <main className="flex-1">
          <SiteHeader />
          {children}
        </main>
      </TooltipProvider>
    </SidebarProvider>
  );
}
