import type { ReactNode } from "react";
import { Topbar } from "@/components/layout/Topbar";
import Sidebar from "@/components/layout/Sidebar";

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 app-bg" />
      <div className="absolute inset-0 app-overlay" />

      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-72 z-30">
        <Sidebar />
      </aside>

      <div className="relative z-10 min-h-screen lg:ml-72 pt-16">
        <Topbar />
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </div>
    </div>
  );
}