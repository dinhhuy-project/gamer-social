"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { PaginatedResponse, SavedItemDTO } from "@/types/api.types";

async function fetchSavedFeed(page: number, perPage: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));

  const res = await fetch(`/api/me/saved?${params.toString()}`, { credentials: "same-origin" });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to fetch saved feed");
  }

  return (await res.json()) as PaginatedResponse<SavedItemDTO>;
}

export function useSavedFeed(page = 1, perPage = 20) {
  return useQuery<PaginatedResponse<SavedItemDTO>, Error>({
    queryKey: ["me", "saved", page],
    queryFn: () => fetchSavedFeed(page, perPage),
    placeholderData: keepPreviousData,
  });
}
