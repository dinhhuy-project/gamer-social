"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { PaginatedResponse, PostDTO } from "@/types/api.types";
import { apiClient } from "@/lib/api/api-client";

async function fetchPosts(page: number, perPage: number, marketplace = false, userId?: string, signal?: AbortSignal) {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("perPage", String(perPage));
  if (marketplace) params.set("marketplace", "true");
  if (userId) params.set("userId", userId);

  const payload = await apiClient<PaginatedResponse<PostDTO>>(`/api/posts?${params.toString()}`, { credentials: "same-origin" }, signal);

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
    queryFn: ({ signal }) => fetchPosts(page, perPage, marketplace, userId, signal),
    enabled,
  });
}
