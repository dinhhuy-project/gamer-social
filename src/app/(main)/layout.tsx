import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/layout/Sidebar"
import { SiteHeader } from "@/components/layout/Topbar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <AppSidebar />
        <main className="flex-1">
          <SiteHeader />
          {children}
        </main>
      </TooltipProvider>
    </SidebarProvider>
  )
}