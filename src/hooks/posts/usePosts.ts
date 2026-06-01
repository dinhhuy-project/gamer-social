"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { PaginatedResponse, PostDTO } from "@/types/api.types";

async function fetchPosts(page: number, perPage: number, marketplace = false, userId?: string) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("perPage", String(perPage));
  if (marketplace) params.set("marketplace", "true");
  if (userId) params.set("userId", userId);

  const res = await fetch(`/api/posts?${params.toString()}`, { credentials: "same-origin" });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg = payload?.error || (await res.text());
    throw new Error(msg || "Failed to fetch posts");
  }

  const payload = (await res.json()) as PaginatedResponse<PostDTO>;

  // Persist the most-recently fetched page of posts to localStorage.
  // Navigating to a different page will overwrite this stored page data.
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const scope = userId ? `user:${userId}` : marketplace ? "marketplace" : "feed";
      const store = {
        scope,
        page,
        perPage,
        payload,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("posts_page", JSON.stringify(store));
    }
  } catch {
    // ignore storage errors
  }

  return payload;
}

export function usePosts(
  page = 1,
  perPage = 20,
  marketplace = false,
  userId?: string,
  enabled = true
): UseQueryResult<PaginatedResponse<PostDTO>, Error> {
  return useQuery<PaginatedResponse<PostDTO>, Error>({
    queryKey: ["posts", userId ? `user:${userId}` : marketplace ? "marketplace" : "feed", page],
    queryFn: () => fetchPosts(page, perPage, marketplace, userId),
    enabled,
  });
}
