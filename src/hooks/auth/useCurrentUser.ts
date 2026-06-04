"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { CurrentUser } from "@/types/api.types";

async function fetchCurrentUser(signal?: AbortSignal): Promise<CurrentUser | null> {
  try {
    const data = await apiClient<CurrentUser | null>("/api/me", { credentials: "same-origin" }, signal);
    return data;
  } catch (err: any) {
    if (err?.status === 401) return null;
    throw err;
  }
}

export function useCurrentUser() {
  return useQuery<CurrentUser | null, Error>({
    queryKey: ["me"],
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}
