"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { GlobalSearchResult } from "@/types/api.types";

async function fetchGlobalSearch(q: string, signal?: AbortSignal) {
  const params = new URLSearchParams();
  params.set("q", q);
  return apiClient<GlobalSearchResult>(`/api/search?${params.toString()}`, { credentials: "same-origin" }, signal);
}

export function useGlobalSearch(q?: string) {
  return useQuery<GlobalSearchResult, Error>({
    queryKey: ["globalSearch", q ?? ""],
    queryFn: ({ signal }) => fetchGlobalSearch(q ?? "", signal),
    enabled: Boolean(q && q.trim().length > 0),
    staleTime: 1000 * 60 * 2,
  });
}
