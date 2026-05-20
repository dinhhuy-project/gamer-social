"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");

    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white"
    >
      Logout
    </button>
  );
}