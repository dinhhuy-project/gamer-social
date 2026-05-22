"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { PaginatedResponse, PostDTO } from "@/types/api.types";

async function fetchPosts(page: number, perPage: number, marketplace = false) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("perPage", String(perPage));
  if (marketplace) params.set("marketplace", "true");

  const res = await fetch(`/api/posts?${params.toString()}`, { credentials: "same-origin" });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to fetch posts");
  }

  return (await res.json()) as PaginatedResponse<PostDTO>;
}

export function usePosts(page = 1, perPage = 20, marketplace = false) {
  return useQuery<PaginatedResponse<PostDTO>, Error>({
    queryKey: ["posts", marketplace ? "marketplace" : "feed", page],
    queryFn: () => fetchPosts(page, perPage, marketplace),
    placeholderData: keepPreviousData,
  });
}
