"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { PaginatedResponse, TagDTO } from "@/types/api.types";

async function fetchTags(page: number, perPage: number, q?: string, signal?: AbortSignal) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  if (q) params.set("q", q);
  return apiClient<PaginatedResponse<TagDTO>>(`/api/tags?${params.toString()}`, { credentials: "same-origin" }, signal);
}

export function useTags(page = 1, perPage = 20, q?: string) {
  return useQuery<PaginatedResponse<TagDTO>, Error>({
    queryKey: ["tags", page, perPage, q ?? ""],
    queryFn: ({ signal }) => fetchTags(page, perPage, q, signal),
    placeholderData: keepPreviousData,
  });
}

export default useTags;
