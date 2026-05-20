"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
