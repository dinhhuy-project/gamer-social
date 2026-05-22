"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { PaginatedResponse, TagDTO } from "@/types/api.types";

async function fetchTags(page: number, perPage: number, q?: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  if (q) params.set("q", q);

  const res = await fetch(`/api/tags?${params.toString()}`, { credentials: "same-origin" });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch tags");

  return (await res.json()) as PaginatedResponse<TagDTO>;
}

export function useTags(page = 1, perPage = 20, q?: string) {
  return useQuery<PaginatedResponse<TagDTO>, Error>({
    queryKey: ["tags", page, perPage, q ?? ""],
    queryFn: () => fetchTags(page, perPage, q),
    placeholderData: keepPreviousData,
  });
}

export default useTags;
