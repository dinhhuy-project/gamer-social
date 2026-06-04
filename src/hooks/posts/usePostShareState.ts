"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/api-client";
import type { ShareStateDTO } from "@/types/api.types";

async function fetchShareState(postId: string, signal?: AbortSignal) {
  return apiClient<ShareStateDTO>(`/api/posts/${encodeURIComponent(postId)}/share`, { credentials: "same-origin" }, signal);
}

export function usePostShareState(postId: string) {
  return useQuery<ShareStateDTO, Error>({
    queryKey: ["postShareState", postId],
    queryFn: ({ signal }) => fetchShareState(postId, signal),
    enabled: Boolean(postId),
  });
}
