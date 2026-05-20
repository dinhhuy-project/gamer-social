import type { ReactNode } from "react";
import { Topbar } from "@/components/layout/Topbar";

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        <Topbar />
        {children}
      </div>
    </div>
  );
}