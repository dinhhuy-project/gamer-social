"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { TagDTO } from "@/types/api.types";

async function fetchTag(slug: string, signal?: AbortSignal) {
  return apiClient<TagDTO>(`/api/tags/${encodeURIComponent(slug)}`, { credentials: "same-origin" }, signal);
}

export function useTag(slug?: string | null) {
  return useQuery<TagDTO, Error>({
    queryKey: ["tags", slug ?? ""],
    enabled: !!slug,
    queryFn: ({ signal }) => fetchTag(String(slug), signal),
  });
}

export default useTag;
