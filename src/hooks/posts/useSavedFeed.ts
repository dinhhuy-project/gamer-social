"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { PaginatedResponse, SavedItemDTO } from "@/types/api.types";

async function fetchSavedFeed(page: number, perPage: number, signal?: AbortSignal) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  return apiClient<PaginatedResponse<SavedItemDTO>>(`/api/me/saved?${params.toString()}`, { credentials: "same-origin" }, signal);
}

export function useSavedFeed(page = 1, perPage = 20) {
  return useQuery<PaginatedResponse<SavedItemDTO>, Error>({
    queryKey: ["me", "saved", page],
    queryFn: ({ signal }) => fetchSavedFeed(page, perPage, signal),
    placeholderData: keepPreviousData,
  });
}
