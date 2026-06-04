"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { PaginatedResponse, PostShareDTO } from "@/types/api.types";

async function fetchPostShares(postId: string, page = 1, perPage = 20, signal?: AbortSignal) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("perPage", String(perPage));
  return apiClient<PaginatedResponse<PostShareDTO>>(`/api/posts/${encodeURIComponent(postId)}/shares?${params.toString()}`, { credentials: "same-origin" }, signal);
}

export function usePostShares(postId: string, page = 1, perPage = 20) {
  return useQuery<PaginatedResponse<PostShareDTO>, Error>({
    queryKey: ["postShares", postId, page],
    queryFn: ({ signal }) => fetchPostShares(postId, page, perPage, signal),
    enabled: Boolean(postId),
  });
}
