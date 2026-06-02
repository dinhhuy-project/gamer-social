"use client";

import { useQuery } from "@tanstack/react-query";
import type { GlobalSearchResult } from "@/types/api.types";

async function fetchGlobalSearch(q: string) {
  const params = new URLSearchParams();
  params.set("q", q);

  const res = await fetch(`/api/search?${params.toString()}`, {
    credentials: "same-origin",
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const error = payload?.error ?? (await res.text());
    throw new Error(error || "Failed to search");
  }

  return (await res.json()) as GlobalSearchResult;
}

export function useGlobalSearch(q?: string) {
  return useQuery<GlobalSearchResult, Error>({
    queryKey: ["globalSearch", q ?? ""],
    queryFn: () => fetchGlobalSearch(q ?? ""),
    enabled: Boolean(q && q.trim().length > 0),
    staleTime: 1000 * 60 * 2,
  });
}
