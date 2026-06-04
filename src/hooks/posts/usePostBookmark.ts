"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { BookmarkStateDTO } from "@/types/api.types";

async function fetchBookmarkState(postId: string, signal?: AbortSignal) {
  return apiClient<BookmarkStateDTO>(`/api/posts/${encodeURIComponent(postId)}/save`, { credentials: "same-origin" }, signal);
}

export function usePostBookmarkState(postId: string) {
  return useQuery<BookmarkStateDTO, Error>({
    queryKey: ["postBookmarkState", postId],
    queryFn: ({ signal }) => fetchBookmarkState(postId, signal),
    enabled: Boolean(postId),
  });
}
