"use client";

import { useQuery } from "@tanstack/react-query";
import type { CurrentUser } from "@/types/api.types";

async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch("/api/me", { credentials: "same-origin" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch current user");
  const data = await res.json();
  return data as CurrentUser;
}

export function useCurrentUser() {
  return useQuery<CurrentUser | null, Error>({
    queryKey: ["me"],
    queryFn: fetchCurrentUser,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}
